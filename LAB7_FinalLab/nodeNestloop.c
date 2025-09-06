/*-------------------------------------------------------------------------
 *
 * nodeNestloop.c
 *	  routines to support nest-loop joins
 *
 * Portions Copyright (c) 1996-2019, PostgreSQL Global Development Group
 * Portions Copyright (c) 1994, Regents of the University of California
 *
 *
 * IDENTIFICATION
 *	  src/backend/executor/nodeNestloop.c
 *
 *-------------------------------------------------------------------------
 */
/*
 *	 INTERFACE ROUTINES
 *		ExecNestLoop	 - process a nestloop join of two plans
 *		ExecInitNestLoop - initialize the join
 *		ExecEndNestLoop  - shut down the join
 */

#include "postgres.h"

#include "executor/execdebug.h"
#include "executor/nodeNestloop.h"
#include "miscadmin.h"
#include "utils/memutils.h"
#include "../include/postmaster/bgworker.h"


/* ----------------------------------------------------------------
 *		ExecNestLoop(node)
 *
 * old comments
 *		Returns the tuple joined from inner and outer tuples which
 *		satisfies the qualification clause.
 *
 *		It scans the inner relation to join with current outer tuple.
 *
 *		If none is found, next tuple from the outer relation is retrieved
 *		and the inner relation is scanned from the beginning again to join
 *		with the outer tuple.
 *
 *		NULL is returned if all the remaining outer tuples are tried and
 *		all fail to join with the inner tuples.
 *
 *		NULL is also returned if there is no tuple from inner relation.
 *
 *		Conditions:
 *		  -- outerTuple contains current tuple from outer relation and
 *			 the right son(inner relation) maintains "cursor" at the tuple
 *			 returned previously.
 *				This is achieved by maintaining a scan position on the outer
 *				relation.
 *
 *		Initial States:
 *		  -- the outer child and the inner child
 *			   are prepared to return the first tuple.
 * ----------------------------------------------------------------
 */
static TupleTableSlot *
ExecNestLoop(PlanState *pstate)
{
	NestLoopState *node = castNode(NestLoopState, pstate);
	NestLoop   *nl;
	PlanState  *innerPlan;
	PlanState  *outerPlan;
	TupleTableSlot *outerTupleSlot;
	TupleTableSlot *innerTupleSlot;
	ExprState  *joinqual;
	ExprState  *otherqual;
	ExprContext *econtext;
	ListCell   *lc;

	CHECK_FOR_INTERRUPTS();

	/*
	 * get information from the node
	 */
	ENL1_printf("getting info from node");

	nl = (NestLoop *) node->js.ps.plan;
	joinqual = node->js.joinqual;
	otherqual = node->js.ps.qual;
	outerPlan = outerPlanState(node);
	innerPlan = innerPlanState(node);
	econtext = node->js.ps.ps_ExprContext;

	/*
	 * Reset per-tuple memory context to free any expression evaluation
	 * storage allocated in the previous tuple cycle.
	 */
	ResetExprContext(econtext);

	/*
	 * Ok, everything is setup for the join so now loop until we return a
	 * qualifying join tuple.
	 */
	ENL1_printf("entering main loop");

	for (;;)
	{
		/*
		 * If we don't have an outer tuple, get the next one and reset the
		 * inner scan.
		 * 先看需不需要新的outer tuple或block
		 */
		if (node->nl_NeedNewOuter)
		{
			ENL1_printf("getting new outer tuple");
			if(node->nl_nextBlock)
			{
				node->rBSize = 0;
				for (int i = 0; i < node->blockSize; i++)
				{
					outerTupleSlot = ExecProcNode(outerPlan);
					if (TupIsNull(outerTupleSlot))
					{
						node->nl_FinishedOuter = true;
						break;
					}
					ExecCopySlot(node->outerBlock[i], outerTupleSlot);
					node->rBSize++;
					node->nl_MatchedOuter[i] = false;	// 一组新的outer tuples需要初始化每个tuple都没匹配到过
				}

				/*
				* if there are no more outer tuples, then the join is complete..
				*/
				if (node->rBSize == 0)
				{
					ENL1_printf("no outer tuple, ending join");
					return NULL;
				}

				node->nl_NeedNewInner = true;
				node->curOuterIndex = 0;	// 每取新的一个block，把current outer index置0
				node->nl_nextBlock = false;

				ENL1_printf("rescanning inner plan");
				ExecReScan(innerPlan);	// 每取新的一个block，从头开始重新扫描innerplan
			}
			else if (node->curOuterIndex < node->rBSize - 1)	// inner relation没遍历完，且block中的outer tuple也没遍历完
			{
				node->curOuterIndex++;
			}
			else	// inner relation没遍历完，但block中的outer tuple已经遍历完，此时需要从头开始扫描block并更新inner tuple
			{
				node->curOuterIndex = 0;
				node->nl_NeedNewInner = true;
			}

			ENL1_printf("saving new outer tuple information");
			econtext->ecxt_outertuple = node->outerBlock[node->curOuterIndex];
			node->nl_NeedNewOuter = false;

			/*
			* fetch the values of any outer Vars that must be passed to the
			* inner scan, and store them in the appropriate PARAM_EXEC slots.
			* 将外层元组的列值传递给内层扫描
			*/
			foreach(lc, nl->nestParams)	// 遍历 nl->nestParams 列表，获取需要传递的每个参数
			{
				NestLoopParam *nlp = (NestLoopParam *) lfirst(lc);
				int			paramno = nlp->paramno;
				ParamExecData *prm;

				prm = &(econtext->ecxt_param_exec_vals[paramno]);
				/* Param value should be an OUTER_VAR var */
				Assert(IsA(nlp->paramval, Var));
				Assert(nlp->paramval->varno == OUTER_VAR);
				Assert(nlp->paramval->varattno > 0);
				prm->value = slot_getattr(node->outerBlock[node->curOuterIndex],
											nlp->paramval->varattno,
											&(prm->isnull));	// 从外层元组（outerTupleSlot[node->curOuterIndex]）中提取参数值
				/* Flag parameter value as changed */
				innerPlan->chgParam = bms_add_member(innerPlan->chgParam,
														paramno);
			}
		}
		
		/*
		 * we have an outerTuple block, try to get the next inner tuple.
		 */
		// 检查是否需要更新inner tuple
		if (node->nl_NeedNewInner)
		{
			ENL1_printf("getting new inner tuple");
			innerTupleSlot = ExecProcNode(innerPlan);
			econtext->ecxt_innertuple = innerTupleSlot;
			node->curOuterIndex = 0;	// 对于每个inner tuple，block中的outer tuple从0开始遍历
			node->nl_NeedNewInner = false;
		}

		// 如果innerplan扫到头了，说明要下一组outer tuple了，
		// 但对于anti_join和left_join需要检查是否所有outer tuple都已经有匹配
		if (TupIsNull(innerTupleSlot))
		{
			ENL1_printf("no inner tuple, need new outer tuple");
			node->nl_NeedNewOuter = true;
			if (node->js.jointype != JOIN_LEFT && node->js.jointype != JOIN_ANTI)
			{
				node->nl_nextBlock = true;
			}
			else if (!node->nl_MatchedOuter[node->curOuterIndex])
			{
				/*
				* We are doing an outer join and there were no join matches
				* for this outer tuple.  Generate a fake join tuple with
				* nulls for the inner tuple, and return it if it passes the
				* non-join quals.
				*/
				
				econtext->ecxt_innertuple = node->nl_NullInnerTupleSlot;

				ENL1_printf("testing qualification for outer-join tuple");

				if (otherqual == NULL || ExecQual(otherqual, econtext))
				{
					/*
					* qualification was satisfied so we project and return
					* the slot containing the result tuple using
					* ExecProject().
					*/
					ENL1_printf("qualification succeeded, projecting tuple");

					return ExecProject(node->js.ps.ps_ProjInfo);
				}
				else
					InstrCountFiltered2(node, 1);

				if (node->curOuterIndex == node->rBSize - 1)
					node->nl_nextBlock = true;			// 检查完block中的所有outer tuple，可以进入下一个block了。
			}
			
			if (node->nl_FinishedOuter)
			{
				ENL1_printf("no inner tuple, ending join");
				return NULL;
			}

			/*
			* Otherwise just return to top of loop to get the next inner tuple.
			*/
			continue;
		}

		// 对每个inner plan中的tuple，和block中的每一个outer tuple比对
		// 此时我们已经有了outer tuple和inner tuple，现在检验是否匹配：

		// 如果为anti_join或只返回第一个匹配，且当前outer tuple已经匹配过了，则直接跳过匹配。
		if ((node->js.jointype == JOIN_ANTI || node->js.single_match) && 
			node->nl_MatchedOuter[node->curOuterIndex] == true)
		{
			node->nl_NeedNewOuter = true;
			continue;
		}
	
		/*
			* at this point we have a new pair of inner and outer tuples so we
			* test the inner and outer tuples to see if they satisfy the node's
			* qualification.
			*
			* Only the joinquals determine MatchedOuter status, but all quals
			* must pass to actually return the tuple.
			*/
		ENL1_printf("testing qualification");
		node->nl_NeedNewOuter = true;		// 每次检查匹配之后都要更新outer tuple
		if (ExecQual(joinqual, econtext))
		{
			node->nl_MatchedOuter[node->curOuterIndex] = true;

			/* In an antijoin, we never return a matched tuple */
			if (node->js.jointype == JOIN_ANTI)
			{
				continue;		/* return to top of loop */
			}

			if (otherqual == NULL || ExecQual(otherqual, econtext))	// 如果没有其他连接条件/其他条件都成立，就构造连接
			{
				/*
					* qualification was satisfied so we project and return the
					* slot containing the result tuple using ExecProject().
					*/
				
				ENL1_printf("qualification succeeded, projecting tuple");

				return ExecProject(node->js.ps.ps_ProjInfo);
			}
			else
				InstrCountFiltered2(node, 1);	// 记录因otherqual被过滤的元组
		}
		else
			InstrCountFiltered1(node, 1);		// 记录因joinqual被过滤的元组

		/*
		 * Tuple fails qual, so free per-tuple memory and try again.
		 */
		ResetExprContext(econtext);

		ENL1_printf("qualification failed, looping");
		
	}
}

/* ----------------------------------------------------------------
 *		ExecInitNestLoop
 * ----------------------------------------------------------------
 */
NestLoopState *
ExecInitNestLoop(NestLoop *node, EState *estate, int eflags)
{
	NestLoopState *nlstate;

	/* check for unsupported flags */
	Assert(!(eflags & (EXEC_FLAG_BACKWARD | EXEC_FLAG_MARK)));

	NL1_printf("ExecInitNestLoop: %s\n",
			   "initializing node");

	/*
	 * create state structure
	 */
	nlstate = makeNode(NestLoopState);
	nlstate->js.ps.plan = (Plan *) node;
	nlstate->js.ps.state = estate;
	nlstate->js.ps.ExecProcNode = ExecNestLoop;

	/*
	 * Miscellaneous initialization
	 *
	 * create expression context for node
	 */
	ExecAssignExprContext(estate, &nlstate->js.ps);

	/*
	 * initialize child nodes
	 *
	 * If we have no parameters to pass into the inner rel from the outer,
	 * tell the inner child that cheap rescans would be good.  If we do have
	 * such parameters, then there is no point in REWIND support at all in the
	 * inner child, because it will always be rescanned with fresh parameter
	 * values.
	 */
	outerPlanState(nlstate) = ExecInitNode(outerPlan(node), estate, eflags);
	if (node->nestParams == NIL)
		eflags |= EXEC_FLAG_REWIND;
	else
		eflags &= ~EXEC_FLAG_REWIND;
	innerPlanState(nlstate) = ExecInitNode(innerPlan(node), estate, eflags);

	/*
	 * Initialize result slot, type and projection.
	 */
	ExecInitResultTupleSlotTL(&nlstate->js.ps, &TTSOpsVirtual);
	ExecAssignProjectionInfo(&nlstate->js.ps, NULL);

	/*
	 * initialize child expressions
	 */
	nlstate->js.ps.qual =
		ExecInitQual(node->join.plan.qual, (PlanState *) nlstate);
	nlstate->js.jointype = node->join.jointype;
	nlstate->js.joinqual =
		ExecInitQual(node->join.joinqual, (PlanState *) nlstate);

	/*
	 * detect whether we need only consider the first matching inner tuple
	 */
	nlstate->js.single_match = (node->join.inner_unique ||
								node->join.jointype == JOIN_SEMI);

	/* set up null tuples for outer joins, if needed */
	switch (node->join.jointype)
	{
		case JOIN_INNER:
		case JOIN_SEMI:
			break;
		case JOIN_LEFT:
		case JOIN_ANTI:
			nlstate->nl_NullInnerTupleSlot =
				ExecInitNullTupleSlot(estate,
									  ExecGetResultType(innerPlanState(nlstate)),
									  &TTSOpsVirtual);
			break;
		default:
			elog(ERROR, "unrecognized join type: %d",
				 (int) node->join.jointype);
	}

	/*
	 * finally, wipe the current outer tuple clean.
	 */
	nlstate->nl_NeedNewOuter = true;

	// 从guc中获取block size的值
	nlstate->blockSize = block_nested_loop_join_block_size;
	if (nlstate->blockSize <= 0)
    	elog(ERROR, "invalid block_nested_loop_join_block_size: %d", nlstate->blockSize);
	// 为外层块分配TupleTableSlot* 数组，长度为blockSize
	nlstate->outerBlock = (TupleTableSlot **) palloc0(nlstate->blockSize * sizeof(TupleTableSlot *));
	// 为外层块中每个tuple分配一个nl_MatchedOuter参数
	nlstate->nl_MatchedOuter = (bool *) palloc0(nlstate->blockSize * sizeof(bool));

	// 使用ExecInitExtraTupleSlot()初始化数组中每个元素
	for (int i = 0; i < nlstate->blockSize; i++)
	{
		nlstate->outerBlock[i] = ExecInitExtraTupleSlot(estate, 
			ExecGetResultType(outerPlanState(nlstate)), 
			ExecGetResultSlotOps(outerPlanState(nlstate), NULL));

		nlstate->nl_MatchedOuter[i] = false;
	}

	// 初始化nlstate的其他值
	nlstate->rBSize = 0;
	nlstate->curOuterIndex = 0;
	nlstate->nl_FinishedOuter = false;
	nlstate->nl_NeedNewInner = true;
	nlstate->nl_nextBlock = true;

	NL1_printf("ExecInitNestLoop: %s\n",
			   "node initialized");

	return nlstate;
}

/* ----------------------------------------------------------------
 *		ExecEndNestLoop
 *
 *		closes down scans and frees allocated storage
 * ----------------------------------------------------------------
 */
void
ExecEndNestLoop(NestLoopState *node)
{
	NL1_printf("ExecEndNestLoop: %s\n",
			   "ending node processing");

	/*
	 * Free the exprcontext
	 */
	ExecFreeExprContext(&node->js.ps);

	/*
	 * clean out the tuple table
	 */
	ExecClearTuple(node->js.ps.ps_ResultTupleSlot);

	// 释放outer block TupleTableSlot占用的所有存储
	if (node->outerBlock)
    {
        for (int i = 0; i < node->blockSize; i++)
        {
            if (node->outerBlock[i])
                ExecClearTuple(node->outerBlock[i]);
        }
    }

	/*
	 * close down subplans
	 */
	ExecEndNode(outerPlanState(node));
	ExecEndNode(innerPlanState(node));

	NL1_printf("ExecEndNestLoop: %s\n",
			   "node processing ended");
}

/* ----------------------------------------------------------------
 *		ExecReScanNestLoop
 * ----------------------------------------------------------------
 */
void
ExecReScanNestLoop(NestLoopState *node)
{
	PlanState  *outerPlan = outerPlanState(node);

	/*
	 * If outerPlan->chgParam is not null then plan will be automatically
	 * re-scanned by first ExecProcNode.
	 */
	if (outerPlan->chgParam == NULL)
		ExecReScan(outerPlan);

	/*
	 * innerPlan is re-scanned for each new outer tuple and MUST NOT be
	 * re-scanned from here or you'll get troubles from inner index scans when
	 * outer Vars are used as run-time keys...
	 */

	node->nl_NeedNewOuter = true;
	for (int i = 0; i < node->blockSize; i++)
	{
		node->nl_MatchedOuter[i] = false;
	}
}
