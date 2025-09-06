# 数据库引论实验报告

## 实验7 Block Nested Loop Join

姓名：

学号：

日期：2025年6月19日

### 1 实验要求

准备Linux开发环境，你可以在Windows下的虚拟机（ VMware ） 里安装，也可以直接安装Linux
系统。进行必要的配置。

下载Postgres安装文件源码，安装前面的介绍进行编译，安装。

理解Postgres的源码，可以利用附录介绍的Source Insight查看源码。

修改源码，并调试（可利用GDB）。

完成后重新编译，安装Postgres。

运行实验测试例子，记录运行花费时间。

撰写实验报告。

### 2 实验开发环境

wsl: Ubuntu 22.04.5 LTS (GNU/Linux 5.15.167.4-microsoft-standard-WSL2 x86_64)

### 3 实验过程

安装和环境准备过程完全按照实验解释文档进行，故省略。

每次进行实验时需重复使用的命令：

- 为了启动postgresql数据库服务：

  ```bash
  /home/zdlee/pgsql/bin/pg_ctl -D /home/zdlee/pgsql/data stop
  
  /home/zdlee/pgsql/bin/pg_ctl -D /home/zdlee/pgsql/data -l logfile start
  ```

- 为了连接到postgresql数据库，打开一个新的终端并输入：

  ```bash
  $HOME/pgsql/bin/psql postgres
  ```

- postgresql默认不使用嵌套循环连接，因此需禁用其他连接方式，在连接到数据库之后我们执行：

  ```postgresql
  set enable_hashjoin = off;
  set enable_mergejoin = off;
  ```
  
  > 不需要了，因为后面我们直接修改`src/backend/utils/misc/guc.c`中的代码，默认禁用其他连接方式。

每次重构代码：

```bash
cd postgresql-12.0
make
make install
```

测试样例：

```postgresql
\c similarity

\timing

SET block_nested_loop_size = 1;  -- 设置为 1 个元组/块
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;

SET block_nested_loop_size = 2;  -- 设置为 2 个元组/块
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;

SET block_nested_loop_size = 8;  -- 设置为 8 个元组/块
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
SELECT count(*) FROM restaurantaddress ra, restaurantphone rp WHERE ra.name
= rp.name;
```

> 运行两次是因为：在数据库性能测试中，第一次运行查询通常会比第二次慢，这是因为第一次查询时数据可能不在内存缓存中，而第二次运行时数据可能已经被缓存了，记录第二次的结果是为了**排除缓存影响**。

调试：

```bash
ps aux | grep postgres

gdb -p <pid>

(gdb) commands
> print node->nl_NeedNewOuter
> print node->nl_NeedNewInner
> print node->nl_nextBlock
> print node->curOuterIndex
> print node->rBSize
> continue
> end
```



在最开始未作任何修改时，我测试样例得到的结果：

```postgresql
-- second run:
Time: 2.877 ms
```

发现速度相比实验中要快的多，可能使用了其他的连接方式。



#### 3.1 分析代码

##### 3.1.1 Postgresql对于Nest Loop Join指令的具体实现逻辑

- 解析阶段：用户输入与Join相关的SQL查询语句，系统接收并调用`backend/parser/parser.c`中的`raw_parser`函数对其进行初始的分析，生成原始查询树。

- 重写阶段：原始查询树输入重写系统进行规则分析和结构重写，将整合的查询转化为相互连接的单独节点，其中包括`NestLoopJoin`节点；这个过程调用`backend/tcop/postgres.c`中的`pg_analyze_and_rewrite`函数实现。
- 生成查询计划并优化：重写后的查询树进入规划系统进行规划和优化，首先根据查询树生成初始化的计划，然后分析最优的查询路径并生成最终的查询计划(Plan)，这一过程主要在文件`backend/optimizer/plan/planner.c`中实现。
- 执行阶段：根据查询计划，对计划节点进行执行。所有节点首先在`backend/executor/execProcnode.c`中进行初始化，然后NestLoopJoin节点具体在`backend/executor/nodeNestloop.c`中实现。
  具体的，`ExecInitNestLoop`函数对节点进行针对性的初始化，包括节点状态、表达式、元组存储结构和执行时需要用到的标志等信息；`ExecNestLoop`开始执行Join算法，首先遍历外表获取外部元组，然后遍历内表，直到函数返回一对匹配的元组构成的Join结果元组或者内表遍历结束，此时回到外表遍历下一个外部元组并重新扫描内表；`ExecEndNestLoop`函数负责在Join节点执行完毕后进行空间释放等清理工作；`ExecReScanNestLoop`函数负责在外表发生改变时自动重新扫描外表。
- 返回结果：在`backend/executor/execMain.c`通过重复上述执行阶段得到连接最终的结果，并继续查询计划的执行直到所有查询完成。

##### 3.1.2 重要模块解读

- `src/backend/executor/execMain.c` 是 PostgreSQL 执行器(Executor)的顶层接口模块，负责协调查询计划的执行流程。作为执行器的总控模块，不包含具体操作逻辑(如连接算法、聚合计算等)，而是协调各个专用执行节点的协作执行。
- `src/backend/executor/execProcnode.c`是PostgreSQL 执行器的节点调度中心，负责根据计划节点类型（Plan Node）动态分发和执行对应的初始化、数据处理（获取元组）、清理操作。
- `src/backend/executor/execScan.c`提供通用关系扫描（Relation Scan）的框架支持，封装扫描节点的公共逻辑（如条件检查和元组投影），允许具体扫描方式（如顺序扫描、索引扫描）通过回调函数实现差异化行为。
- `src/backend/executor/execTuples.c`是PostgreSQL 执行器中元组（Tuple）管理和类型处理的核心模块，主要提供以下两大功能：元组表槽（TupleTableSlot）管理和元组类型信息处理。
- `src/backend/executor/nodeNestloop.c`是实现 PostgreSQL 中的嵌套循环连接（NestLoop Join）逻辑的具体部分，支持通过双重循环匹配内外表元组完成连接操作。**需要修改。**
- `src/backend/utils/fmgr/funcapi.c`为 PostgreSQL 函数管理器（FMGR）提供返回集合（SETOF）、复合类型（Composite Types）或处理可变参数（VARIADIC）的辅助工具函数，简化复杂函数的开发。
- `src/include/catalog/pg_proc.h`定义了 PostgreSQL 系统目录表 **`pg_proc`** 的结构和元数据，该表用于存储数据库中所有函数/存储过程（包括内置函数和用户自定义函数）的定义信息。
- `src/include/executor/nodeNestloop.h`定义 PostgreSQL 执行器中嵌套循环连接（NestLoop Join）节点的数据结构和接口声明，为 `nodeNestloop.c` 的实现提供必要的类型和函数原型。
- `src/include/nodes/execnodes.h`定义 PostgreSQL 执行器（Executor）中所有状态节点（State Nodes）的数据结构，是执行器运行时状态管理的核心头文件。**需要修改。**
- `src/backend/utils/misc/guc.c`实现了 PostgreSQL 的统一配置管理系统（GUC, Grand Unified Configuration），集中管理所有运行时参数的设置、验证和持久化，支持通过多种方式（配置文件、SQL命令、命令行等）动态调整数据库行为。**需要修改。**

##### 3.1.3 对nodeNestedloop.c功能和实现原理的详细分析

**3.1.3.1 主要函数分析**

1. **ExecInitNestLoop** - 初始化嵌套循环连接
   - 创建并初始化NestLoopState结构体
   - 初始化左右子计划(outerPlan和innerPlan)
   - 设置表达式上下文和投影信息
   - 为外连接准备NULL元组槽

2. **ExecNestLoop** - 执行嵌套循环连接的核心逻辑
   - 实现双重循环：外层循环遍历outerPlan（外层关系），内层循环遍历innerPlan（内层关系）
   - 处理各种连接类型(INNER, LEFT, ANTI, SEMI)
   - 应用连接条件(joinqual)和其他条件(otherqual)

3. **ExecEndNestLoop** - 清理资源
   - 释放表达式上下文
   - 清理元组表
   - 关闭子计划

4. **ExecReScanNestLoop** - 重新扫描准备
   - 重置连接状态
   - 处理参数变化情况

**3.1.3.2 ExecNestLoop流程：**

1. 获取新的外层元组(如果需要)
   - 通过`ExecProcNode(outerPlan)`获取
   - 如果没有更多外层元组则返回NULL

2. 为外层元组重新扫描内层计划
   - 通过`ExecReScan(innerPlan)`重置内层扫描
   - 传递外层参数到内层扫描

3. 获取内层元组并测试连接条件
   - 通过`ExecProcNode(innerPlan)`获取内层元组
   - 应用`joinqual`和`otherqual`条件

4. 处理匹配结果
   - 对于匹配的元组：执行投影并返回结果
   - 对于不匹配的情况：处理外连接的特殊情况

**3.1.3.3 重要状态变量：**

- `nl_NeedNewOuter`：标记是否需要获取新的外层元组
- `nl_MatchedOuter`：标记当前外层元组是否已有匹配
- `js.jointype`：连接类型(INNER/LEFT/ANTI/SEMI)

**3.1.3.4 连接类型**

- **INNER JOIN**：只返回匹配的元组
- **LEFT JOIN**：外层不匹配时补NULL
- **ANTI JOIN**：返回不匹配的元组
- **SEMI JOIN**：只返回第一个匹配



#### 3.2 修改代码

##### 3.2.1 块大小设置参数实现

首先，为了能够测试不同不同块大小的block_nested_loop_join，我添加了如下的代码：

```c
// backend/utils/misc/guc.c
// begin at line 1963

int block_nested_loop_join_block_size;

static struct config_int ConfigureNamesInt[] =
{
	{
		{"block_nested_loop_size",
		PGC_USERSET,
		RESOURCES_MEM,
		gettext_noop("Sets the block size for nested loop joins."),
		NULL,
		GUC_UNIT_BLOCKS
		},
		&block_nested_loop_join_block_size,
		128,	// default size
		1,		// min size
		1024,	// max size
		NULL, NULL, NULL
	},
```

我声明了一个全局整型变量 `block_nested_loop_join_block_size` 用于存储块嵌套循环连接的块大小值。我在 `ConfigureNamesInt[]` 配置数组中定义了名为 `"block_nested_loop_size"` 的参数，该参数控制 PostgreSQL 执行器在进行块嵌套循环连接操作时，每次从外关系(outer relation)读取的元组块大小，通过调整块大小可以优化连接操作的性能表现。

psql中查看块大小：

```postgresql
show block_nested_loop_size;
```

psql中设置块大小（临时生效，仅当前会话）：

```postgresql
SET block_nested_loop_size = 1;  -- 设置为 1 个元组/块
```

##### 3.2.2 禁用其他连接方式

postgresql默认不使用嵌套循环连接，因此需禁用其他连接方式，为了省去每次的手动设置，我们直接修改代码，使得hash join和merge join默认被禁用：

```c
// backend/utils/misc/guc.c
// begin at line 983

	{
		{"enable_hashjoin", PGC_USERSET, QUERY_TUNING_METHOD,
			gettext_noop("Enables the planner's use of hash join plans."),
			NULL,
			GUC_EXPLAIN
		},
		&enable_hashjoin,
		false,		// default
		NULL, NULL, NULL
	},
```

```c
// backend/utils/misc/guc.c
// begin at line 973

	{
		{"enable_mergejoin", PGC_USERSET, QUERY_TUNING_METHOD,
			gettext_noop("Enables the planner's use of merge join plans."),
			NULL,
			GUC_EXPLAIN
		},
		&enable_mergejoin,
		false,		// default
		NULL, NULL, NULL
	},
```

##### 3.2.3 修改execnodes.h

```c
typedef struct NestLoopState
{
	JoinState	js;				/* its first field is NodeTag */
	bool		nl_NeedNewOuter;	// 是否需要重新读取新的外层元组/新的block
	bool		*nl_MatchedOuter;	// 当前外层元组是否已经匹配过inner，修改成数组，因为需要保存block中每一个outer tuple的状态。
	TupleTableSlot *nl_NullInnerTupleSlot;

	int blockSize;					// block大小，即一次从外层读入的tuple数
	int rBSize;						// 实际读到的外层tuple数量
	int curOuterIndex;				// 当前块中处理到到的外层tuple的编号（从0开始）
	TupleTableSlot **outerBlock;	// 外层块的tuple数组，长度=blocksize

	bool nl_NeedNewInner;			// 是否要读取新的inner元组
	bool nl_FinishedOuter;			// 是否已经处理完所有outer元组
	bool nl_nextBlock;				// 是否需要进下一个block
} NestLoopState;
```

因为要适应block nested loop join算法，所以修改了`nl_MatchedOuter`和`outerBlock`的定义，可以指向多个元素。

同时也加入了`blockSize`、`rBSize`、`curOuterIndex`、`nl_NeedNewInner`、`nl_FinishedOuter`、`nl_nextBlock`，等新参数。



##### 3.2.4 修改nodeNestedLoop.c

为了能使用guc.c中定义的`block_nested_loop_join_block_size`，我们需要在nodeNestedLoop.h中添加一行代码：

```c
extern int block_nested_loop_join_block_size;
```

主循环：

```c
static TupleTableSlot *
ExecNestLoop(PlanState *pstate)
{
	/* 此部分代码基本保持不变，主要修改部分见下方 */

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
```

首先，`if (node->nl_NeedNewOuter)`模块检测是否需要新的Outer tuple：

- 如果需要更新则有一下三种情况：

  - 如果需要新的block，则扫描一个新的block，初始化各项参数；

  - 如果对于当前inner tuple还有Outer Tuple没有扫描完，则继续扫描；

  - 反之，如果当前inner tuple所有Outer Tuple扫描完成，则扫描下一个inner tuple，并且将outer tuple的序号重新置为0。

- 然后，按照当前的`node->curOuterIndex`取出对应的outer tuple。

然后，`if (node->nl_NeedNewInner)`模块检测是否需要去到下一个inner tuple，如果需要，则取出下一个inner tuple。

如果取出的inner tuple为null，则说明inner relation扫描到结尾，需要取出下一个outer tuple的block。

如果取出的inner tuple不为null，则检测是否可以和outer tuple连接。如果可以连接，返回连接得到的结果，反之，继续循环。



初始化函数：

```c
NestLoopState *
ExecInitNestLoop(NestLoop *node, EState *estate, int eflags)
{
	/* 此部分代码基本保持不变，主要修改部分见下方 */

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
```

主要添加了新增参数的初始化。



ExecEndNestLoop和ExecReScanNestLoop：

```c
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
```

主要适应了`NestLoopState`指向多个outer tuple元素的新结构。



### 4 实验结果

```
count
   451
(1 row)
```

| 块大小 | 运行时间   | 加速比 |
| ------ | ---------- | ------ |
| 1      | 330.458 ms | 00.00% |
| 2      | 265.301 ms | 24.56% |
| 4      | 245.600 ms | 34.55% |
| 8      | 211.407 ms | 56.31% |
| 16     | 198.387 ms | 66.57% |
| 32     | 188.324 ms | 75.47% |

因为

```
select count(*) from restaurantaddress;
 count
-------
  2439
(1 row)

select count(*) from restaurantphone;
 count
-------
  2463
(1 row)
```

设每块存的元组数为B，内存可用块数为M，假设内存大小不足以存储所有内表元组，则Block Nested Loops Join的开销大致为：

transfer: $\frac{2439}{B}+\lceil \frac{2439}{B\cdot M}\rceil \cdot 2463$

seek: $2 \lceil \frac{2439}{B\cdot M} \rceil$

可以分析出B越大，传输和寻找的开销都会降低。从我们得到的结果来看，可以发现运行时间的变化符合这一结论，而且还可以看到当B降到一定大小时，继续增大B对于运行时间减少的作用越来越不明显，这也基本符和反比例函数的变化趋势。



### 5 实验总结

本次实验让我亲手尝试了修改postgresql的连接代码，是我对数据库的运行方式和表的连接有了更为深刻的认识。

实验过程中，我曾遇到了代码循环无法停止的问题，经过询问助教老师和自己的思考与尝试，最终发现问题出在：

```c
else if (node->nl_FinishedOuter)	// 需要去掉else
			{
				ENL1_printf("no inner tuple, ending join");
				return NULL;
			}
```

导致只有left join和anti join会进入到这段代码区，从而有些情况循环无法终止。

感谢老师们的给予我的尽心帮助，让我在这门课程和此次实验中得到了很大的收获。
