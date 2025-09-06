# Fudan-Introduction-to-Database-System-2025-Spring
This repository contains my solutions for the Introduction to Database Systems course (taken in Spring 2025) labs.

## Midterm Lab: Book Sales Management System
Design and implementation of a Book Sales Management System

### Final Lab: Implementation and Performance Analysis of Block Nested Loop Join in PostgreSQL
(the following content were produed by ai)
This project involved modifying the PostgreSQL database kernel to implement a Block Nested Loop Join algorithm, a fundamental database join operation optimized for reduced I/O overhead.

Key Tasks Completed:

1. PostgreSQL Source Code Modification: Modified core PostgreSQL source files, primarily nodeNestloop.c, to implement the BNLJ algorithm. Changes included adding state variables to manage blocks of tuples and restructuring the join loop logic.

2. New Configuration Parameter: Added a custom runtime parameter (block_nested_loop_size) in guc.c to allow users to dynamically set the number of tuples per block, enabling flexible performance tuning.

3. Executor Node Changes: Updated the NestLoopState structure in execnodes.h to support storing a block of outer tuples and their match status, moving beyond the classic single-tuple nested loop.

4. Performance Benchmarking: Conducted extensive performance tests by executing joins with varying block sizes (1, 2, 4, 8, 16, 32 tuples/block). Results demonstrated a clear performance improvement of over 75% as the block size increased, validating the theoretical advantage of reducing I/O operations.

5. Debugging & Analysis: Used GDB for debugging and performed a thorough analysis of PostgreSQL's query execution lifecycle, from parsing to plan execution.

Technologies Used: C, PostgreSQL 12.0, Linux (WSL/Ubuntu), GDB
