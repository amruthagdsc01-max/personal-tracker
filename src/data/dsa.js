// DSA curriculum, ordered like a course (inspired by the module-by-module structure
// of sheets such as Striver's A2Z). Problem id = LeetCode slug; links point to leetcode.com.
// Format per problem: [title, slug, difficulty E|M|H]

const P = (list) => list.map(([title, slug, diff]) => ({ id: slug, title, diff }))

export const DSA_TOPICS = [
  {
    id: 'arrays', name: 'Arrays', blurb: 'Almost every interview starts here. Learn to scan once, track a running value, and use extra space deliberately.',
    learn: ['Traversal & in-place updates', 'Prefix sums & Kadane', 'Sorting + scanning', 'Time/space complexity (Big-O)'],
    problems: P([
      ['Two Sum', 'two-sum', 'E'], ['Best Time to Buy and Sell Stock', 'best-time-to-buy-and-sell-stock', 'E'], ['Contains Duplicate', 'contains-duplicate', 'E'],
      ['Maximum Subarray', 'maximum-subarray', 'M'], ['Product of Array Except Self', 'product-of-array-except-self', 'M'], ['Move Zeroes', 'move-zeroes', 'E'],
      ['Majority Element', 'majority-element', 'E'], ['Missing Number', 'missing-number', 'E'], ['Merge Sorted Array', 'merge-sorted-array', 'E'],
      ['Remove Duplicates from Sorted Array', 'remove-duplicates-from-sorted-array', 'E'], ['Rotate Array', 'rotate-array', 'M'], ['Sort Colors', 'sort-colors', 'M'],
      ['Next Permutation', 'next-permutation', 'M'], ['Set Matrix Zeroes', 'set-matrix-zeroes', 'M'], ['Rotate Image', 'rotate-image', 'M'],
      ['Spiral Matrix', 'spiral-matrix', 'M'], ['Merge Intervals', 'merge-intervals', 'M'],
    ]),
  },
  {
    id: 'hashing', name: 'Hashing', blurb: 'Trade memory for speed. If you catch yourself writing a nested loop to "look something up", a hash map is usually the fix.',
    learn: ['Hash map / set operations are O(1) average', 'Frequency counting', 'Prefix-sum + hash map trick'],
    problems: P([
      ['Valid Anagram', 'valid-anagram', 'E'], ['Ransom Note', 'ransom-note', 'E'], ['First Unique Character in a String', 'first-unique-character-in-a-string', 'E'],
      ['Isomorphic Strings', 'isomorphic-strings', 'E'], ['Intersection of Two Arrays', 'intersection-of-two-arrays', 'E'], ['Group Anagrams', 'group-anagrams', 'M'],
      ['Top K Frequent Elements', 'top-k-frequent-elements', 'M'], ['Longest Consecutive Sequence', 'longest-consecutive-sequence', 'M'], ['Subarray Sum Equals K', 'subarray-sum-equals-k', 'M'],
    ]),
  },
  {
    id: 'twoptr', name: 'Two Pointers & Sliding Window', blurb: 'Turns O(n²) brute force into O(n). Two of the most reusable patterns in interviews.',
    learn: ['Opposite-end pointers on sorted data', 'Fixed vs variable window', 'When to shrink the window'],
    problems: P([
      ['Valid Palindrome', 'valid-palindrome', 'E'], ['Two Sum II - Input Array Is Sorted', 'two-sum-ii-input-array-is-sorted', 'M'], ['3Sum', '3sum', 'M'],
      ['Container With Most Water', 'container-with-most-water', 'M'], ['Maximum Average Subarray I', 'maximum-average-subarray-i', 'E'],
      ['Longest Substring Without Repeating Characters', 'longest-substring-without-repeating-characters', 'M'], ['Longest Repeating Character Replacement', 'longest-repeating-character-replacement', 'M'],
      ['Permutation in String', 'permutation-in-string', 'M'], ['Trapping Rain Water', 'trapping-rain-water', 'H'], ['Minimum Window Substring', 'minimum-window-substring', 'H'],
      ['Sliding Window Maximum', 'sliding-window-maximum', 'H'],
    ]),
  },
  {
    id: 'strings', name: 'Strings', blurb: 'Parsing and manipulation questions. Practise clean, edge-case-proof code.',
    learn: ['Immutability and building strings efficiently', 'Palindromes & expand-around-center', 'Parsing with state'],
    problems: P([
      ['Reverse String', 'reverse-string', 'E'], ['Longest Common Prefix', 'longest-common-prefix', 'E'], ['Reverse Words in a String', 'reverse-words-in-a-string', 'M'],
      ['Find the Index of the First Occurrence in a String', 'find-the-index-of-the-first-occurrence-in-a-string', 'E'], ['String to Integer (atoi)', 'string-to-integer-atoi', 'M'],
      ['Longest Palindromic Substring', 'longest-palindromic-substring', 'M'], ['Palindromic Substrings', 'palindromic-substrings', 'M'],
    ]),
  },
  {
    id: 'binsearch', name: 'Binary Search', blurb: 'Not just "find a number". The real skill: binary search on the answer.',
    learn: ['Classic template (low/high/mid)', 'Rotated arrays', 'Search on answer space'],
    problems: P([
      ['Binary Search', 'binary-search', 'E'], ['Search Insert Position', 'search-insert-position', 'E'], ['Sqrt(x)', 'sqrtx', 'E'],
      ['Find First and Last Position of Element in Sorted Array', 'find-first-and-last-position-of-element-in-sorted-array', 'M'], ['Search in Rotated Sorted Array', 'search-in-rotated-sorted-array', 'M'],
      ['Find Minimum in Rotated Sorted Array', 'find-minimum-in-rotated-sorted-array', 'M'], ['Find Peak Element', 'find-peak-element', 'M'], ['Search a 2D Matrix', 'search-a-2d-matrix', 'M'],
      ['Koko Eating Bananas', 'koko-eating-bananas', 'M'], ['Capacity To Ship Packages Within D Days', 'capacity-to-ship-packages-within-d-days', 'M'],
      ['Median of Two Sorted Arrays', 'median-of-two-sorted-arrays', 'H'],
    ]),
  },
  {
    id: 'linkedlist', name: 'Linked List', blurb: 'Pointer manipulation. Draw it on paper first; code second.',
    learn: ['Fast & slow pointers', 'Reversal in place', 'Dummy head node'],
    problems: P([
      ['Reverse Linked List', 'reverse-linked-list', 'E'], ['Merge Two Sorted Lists', 'merge-two-sorted-lists', 'E'], ['Linked List Cycle', 'linked-list-cycle', 'E'],
      ['Middle of the Linked List', 'middle-of-the-linked-list', 'E'], ['Palindrome Linked List', 'palindrome-linked-list', 'E'], ['Intersection of Two Linked Lists', 'intersection-of-two-linked-lists', 'E'],
      ['Remove Nth Node From End of List', 'remove-nth-node-from-end-of-list', 'M'], ['Add Two Numbers', 'add-two-numbers', 'M'], ['Linked List Cycle II', 'linked-list-cycle-ii', 'M'],
      ['Reorder List', 'reorder-list', 'M'], ['Copy List with Random Pointer', 'copy-list-with-random-pointer', 'M'], ['LRU Cache', 'lru-cache', 'M'], ['Merge k Sorted Lists', 'merge-k-sorted-lists', 'H'],
    ]),
  },
  {
    id: 'stack', name: 'Stack & Queue', blurb: 'LIFO/FIFO thinking, and the monotonic stack — a favourite for "next greater" questions.',
    learn: ['Matching brackets', 'Monotonic stack', 'Queue via stacks'],
    problems: P([
      ['Valid Parentheses', 'valid-parentheses', 'E'], ['Min Stack', 'min-stack', 'M'], ['Implement Queue using Stacks', 'implement-queue-using-stacks', 'E'],
      ['Next Greater Element I', 'next-greater-element-i', 'E'], ['Evaluate Reverse Polish Notation', 'evaluate-reverse-polish-notation', 'M'], ['Daily Temperatures', 'daily-temperatures', 'M'],
      ['Car Fleet', 'car-fleet', 'M'], ['Asteroid Collision', 'asteroid-collision', 'M'], ['Largest Rectangle in Histogram', 'largest-rectangle-in-histogram', 'H'],
    ]),
  },
  {
    id: 'backtrack', name: 'Recursion & Backtracking', blurb: 'Choose, explore, un-choose. The foundation for trees, graphs and DP.',
    learn: ['Base case + recursive case', 'Decision tree of choices', 'Pruning duplicates'],
    problems: P([
      ['Subsets', 'subsets', 'M'], ['Subsets II', 'subsets-ii', 'M'], ['Permutations', 'permutations', 'M'], ['Combination Sum', 'combination-sum', 'M'],
      ['Combination Sum II', 'combination-sum-ii', 'M'], ['Letter Combinations of a Phone Number', 'letter-combinations-of-a-phone-number', 'M'], ['Generate Parentheses', 'generate-parentheses', 'M'],
      ['Palindrome Partitioning', 'palindrome-partitioning', 'M'], ['Word Search', 'word-search', 'M'], ['N-Queens', 'n-queens', 'H'],
    ]),
  },
  {
    id: 'trees', name: 'Binary Trees', blurb: 'Most tree problems are one recursion idea: solve for the children, combine at the root.',
    learn: ['DFS (pre/in/post-order)', 'BFS level order', 'Return values vs. global variables'],
    problems: P([
      ['Maximum Depth of Binary Tree', 'maximum-depth-of-binary-tree', 'E'], ['Invert Binary Tree', 'invert-binary-tree', 'E'], ['Same Tree', 'same-tree', 'E'],
      ['Symmetric Tree', 'symmetric-tree', 'E'], ['Binary Tree Inorder Traversal', 'binary-tree-inorder-traversal', 'E'], ['Diameter of Binary Tree', 'diameter-of-binary-tree', 'E'],
      ['Balanced Binary Tree', 'balanced-binary-tree', 'E'], ['Path Sum', 'path-sum', 'E'], ['Subtree of Another Tree', 'subtree-of-another-tree', 'E'],
      ['Binary Tree Level Order Traversal', 'binary-tree-level-order-traversal', 'M'], ['Binary Tree Right Side View', 'binary-tree-right-side-view', 'M'],
      ['Lowest Common Ancestor of a Binary Tree', 'lowest-common-ancestor-of-a-binary-tree', 'M'], ['Construct Binary Tree from Preorder and Inorder Traversal', 'construct-binary-tree-from-preorder-and-inorder-traversal', 'M'],
      ['Binary Tree Maximum Path Sum', 'binary-tree-maximum-path-sum', 'H'], ['Serialize and Deserialize Binary Tree', 'serialize-and-deserialize-binary-tree', 'H'],
    ]),
  },
  {
    id: 'bst', name: 'Binary Search Trees', blurb: 'Use the ordering property: left < root < right. In-order traversal gives sorted output.',
    learn: ['BST property', 'In-order = sorted', 'Insert / delete'],
    problems: P([
      ['Validate Binary Search Tree', 'validate-binary-search-tree', 'M'], ['Kth Smallest Element in a BST', 'kth-smallest-element-in-a-bst', 'M'],
      ['Lowest Common Ancestor of a Binary Search Tree', 'lowest-common-ancestor-of-a-binary-search-tree', 'M'], ['Insert into a Binary Search Tree', 'insert-into-a-binary-search-tree', 'M'],
      ['Delete Node in a BST', 'delete-node-in-a-bst', 'M'], ['Convert Sorted Array to Binary Search Tree', 'convert-sorted-array-to-binary-search-tree', 'E'],
    ]),
  },
  {
    id: 'heaps', name: 'Heaps / Priority Queue', blurb: '"Top K", "kth largest", "merge sorted streams" — all heaps.',
    learn: ['Min-heap vs max-heap', 'Heap of size K', 'Two heaps for medians'],
    problems: P([
      ['Kth Largest Element in an Array', 'kth-largest-element-in-an-array', 'M'], ['Last Stone Weight', 'last-stone-weight', 'E'], ['K Closest Points to Origin', 'k-closest-points-to-origin', 'M'],
      ['Task Scheduler', 'task-scheduler', 'M'], ['Find Median from Data Stream', 'find-median-from-data-stream', 'H'],
    ]),
  },
  {
    id: 'graphs', name: 'Graphs', blurb: 'Model the problem as nodes and edges, then BFS/DFS. Companies love these because they test modelling.',
    learn: ['Adjacency list', 'BFS (shortest path, unweighted) vs DFS', 'Cycle detection & topological sort', 'Dijkstra'],
    problems: P([
      ['Number of Islands', 'number-of-islands', 'M'], ['Max Area of Island', 'max-area-of-island', 'M'], ['Flood Fill', 'flood-fill', 'E'], ['Clone Graph', 'clone-graph', 'M'],
      ['Rotting Oranges', 'rotting-oranges', 'M'], ['Find if Path Exists in Graph', 'find-if-path-exists-in-graph', 'E'], ['Pacific Atlantic Water Flow', 'pacific-atlantic-water-flow', 'M'],
      ['Surrounded Regions', 'surrounded-regions', 'M'], ['Course Schedule', 'course-schedule', 'M'], ['Course Schedule II', 'course-schedule-ii', 'M'],
      ['Is Graph Bipartite?', 'is-graph-bipartite', 'M'], ['Redundant Connection', 'redundant-connection', 'M'], ['Network Delay Time', 'network-delay-time', 'M'],
      ['Cheapest Flights Within K Stops', 'cheapest-flights-within-k-stops', 'M'], ['Word Ladder', 'word-ladder', 'H'],
    ]),
  },
  {
    id: 'dp', name: 'Dynamic Programming', blurb: 'Define the state, write the recurrence, then add memoization. Start 1-D, then 2-D.',
    learn: ['Overlapping subproblems', 'Top-down (memo) vs bottom-up', 'State definition is 80% of the work'],
    problems: P([
      ['Climbing Stairs', 'climbing-stairs', 'E'], ['Min Cost Climbing Stairs', 'min-cost-climbing-stairs', 'E'], ['House Robber', 'house-robber', 'M'], ['House Robber II', 'house-robber-ii', 'M'],
      ['Coin Change', 'coin-change', 'M'], ['Longest Increasing Subsequence', 'longest-increasing-subsequence', 'M'], ['Word Break', 'word-break', 'M'], ['Decode Ways', 'decode-ways', 'M'],
      ['Maximum Product Subarray', 'maximum-product-subarray', 'M'], ['Unique Paths', 'unique-paths', 'M'], ['Longest Common Subsequence', 'longest-common-subsequence', 'M'],
      ['Partition Equal Subset Sum', 'partition-equal-subset-sum', 'M'], ['Target Sum', 'target-sum', 'M'], ['Edit Distance', 'edit-distance', 'H'],
    ]),
  },
  {
    id: 'greedy', name: 'Greedy & Intervals', blurb: 'Make the locally best choice — and learn to justify why it is globally safe.',
    learn: ['Exchange argument', 'Sorting then sweeping', 'Interval overlap logic'],
    problems: P([
      ['Assign Cookies', 'assign-cookies', 'E'], ['Lemonade Change', 'lemonade-change', 'E'], ['Jump Game', 'jump-game', 'M'], ['Jump Game II', 'jump-game-ii', 'M'],
      ['Gas Station', 'gas-station', 'M'], ['Partition Labels', 'partition-labels', 'M'], ['Insert Interval', 'insert-interval', 'M'], ['Non-overlapping Intervals', 'non-overlapping-intervals', 'M'],
    ]),
  },
  {
    id: 'bits', name: 'Bits & Math', blurb: 'Short, tricky, and common in screening rounds.',
    learn: ['XOR properties', 'Bit masks & shifts', 'Fast exponentiation'],
    problems: P([
      ['Single Number', 'single-number', 'E'], ['Number of 1 Bits', 'number-of-1-bits', 'E'], ['Counting Bits', 'counting-bits', 'E'], ['Reverse Bits', 'reverse-bits', 'E'],
      ['Power of Two', 'power-of-two', 'E'], ['Happy Number', 'happy-number', 'E'], ['Count Primes', 'count-primes', 'M'], ['Pow(x, n)', 'powx-n', 'M'], ['Sum of Two Integers', 'sum-of-two-integers', 'M'],
    ]),
  },
  {
    id: 'tries', name: 'Tries', blurb: 'Prefix problems — autocomplete, spell check, word search.',
    learn: ['Node with children map', 'Insert / search / startsWith'],
    problems: P([
      ['Implement Trie (Prefix Tree)', 'implement-trie-prefix-tree', 'M'], ['Design Add and Search Words Data Structure', 'design-add-and-search-words-data-structure', 'M'], ['Word Search II', 'word-search-ii', 'H'],
    ]),
  },
]

// ---- expansion: more practice per module (appended after the core problems) ----
const MORE = {
  arrays: [
    ['Running Sum of 1d Array', 'running-sum-of-1d-array', 'E'], ['Max Consecutive Ones', 'max-consecutive-ones', 'E'], ['Plus One', 'plus-one', 'E'], ["Pascal's Triangle", 'pascals-triangle', 'E'],
    ['Squares of a Sorted Array', 'squares-of-a-sorted-array', 'E'], ['Find Pivot Index', 'find-pivot-index', 'E'], ['Find All Numbers Disappeared in an Array', 'find-all-numbers-disappeared-in-an-array', 'E'],
    ['Find the Duplicate Number', 'find-the-duplicate-number', 'M'], ['Majority Element II', 'majority-element-ii', 'M'], ['Valid Sudoku', 'valid-sudoku', 'M'], ['Search a 2D Matrix II', 'search-a-2d-matrix-ii', 'M'],
    ['Game of Life', 'game-of-life', 'M'], ['First Missing Positive', 'first-missing-positive', 'H'],
  ],
  hashing: [
    ['Contains Duplicate II', 'contains-duplicate-ii', 'E'], ['Word Pattern', 'word-pattern', 'E'], ['Design HashSet', 'design-hashset', 'E'], ['Design HashMap', 'design-hashmap', 'E'], ['4Sum II', '4sum-ii', 'M'],
  ],
  twoptr: [
    ['Remove Element', 'remove-element', 'E'], ['3Sum Closest', '3sum-closest', 'M'], ['Minimum Size Subarray Sum', 'minimum-size-subarray-sum', 'M'], ['Max Consecutive Ones III', 'max-consecutive-ones-iii', 'M'],
    ['Fruit Into Baskets', 'fruit-into-baskets', 'M'], ['Subarray Product Less Than K', 'subarray-product-less-than-k', 'M'],
  ],
  strings: [
    ['Length of Last Word', 'length-of-last-word', 'E'], ['Roman to Integer', 'roman-to-integer', 'E'], ['Add Binary', 'add-binary', 'E'], ['Valid Palindrome II', 'valid-palindrome-ii', 'E'],
    ['Integer to Roman', 'integer-to-roman', 'M'], ['Count and Say', 'count-and-say', 'M'], ['Multiply Strings', 'multiply-strings', 'M'], ['Compare Version Numbers', 'compare-version-numbers', 'M'], ['String Compression', 'string-compression', 'M'],
  ],
  binsearch: [
    ['First Bad Version', 'first-bad-version', 'E'], ['Guess Number Higher or Lower', 'guess-number-higher-or-lower', 'E'], ['Single Element in a Sorted Array', 'single-element-in-a-sorted-array', 'M'],
    ['Search in Rotated Sorted Array II', 'search-in-rotated-sorted-array-ii', 'M'], ['Find K Closest Elements', 'find-k-closest-elements', 'M'], ['Kth Smallest Element in a Sorted Matrix', 'kth-smallest-element-in-a-sorted-matrix', 'M'],
    ['Minimum Number of Days to Make m Bouquets', 'minimum-number-of-days-to-make-m-bouquets', 'M'], ['Split Array Largest Sum', 'split-array-largest-sum', 'H'],
  ],
  linkedlist: [
    ['Remove Linked List Elements', 'remove-linked-list-elements', 'E'], ['Remove Duplicates from Sorted List', 'remove-duplicates-from-sorted-list', 'E'], ['Delete Node in a Linked List', 'delete-node-in-a-linked-list', 'M'],
    ['Odd Even Linked List', 'odd-even-linked-list', 'M'], ['Swap Nodes in Pairs', 'swap-nodes-in-pairs', 'M'], ['Rotate List', 'rotate-list', 'M'], ['Reverse Linked List II', 'reverse-linked-list-ii', 'M'],
    ['Partition List', 'partition-list', 'M'], ['Sort List', 'sort-list', 'M'], ['Reverse Nodes in k-Group', 'reverse-nodes-in-k-group', 'H'],
  ],
  stack: [
    ['Baseball Game', 'baseball-game', 'E'], ['Remove All Adjacent Duplicates In String', 'remove-all-adjacent-duplicates-in-string', 'E'], ['Decode String', 'decode-string', 'M'],
    ['Next Greater Element II', 'next-greater-element-ii', 'M'], ['Online Stock Span', 'online-stock-span', 'M'], ['Remove K Digits', 'remove-k-digits', 'M'], ['Simplify Path', 'simplify-path', 'M'],
    ['Basic Calculator II', 'basic-calculator-ii', 'M'], ['Sum of Subarray Minimums', 'sum-of-subarray-minimums', 'M'], ['Maximal Rectangle', 'maximal-rectangle', 'H'],
  ],
  backtrack: [
    ['Combinations', 'combinations', 'M'], ['Permutations II', 'permutations-ii', 'M'], ['Combination Sum III', 'combination-sum-iii', 'M'], ['Restore IP Addresses', 'restore-ip-addresses', 'M'],
    ['Beautiful Arrangement', 'beautiful-arrangement', 'M'], ['Word Break II', 'word-break-ii', 'H'], ['N-Queens II', 'n-queens-ii', 'H'], ['Sudoku Solver', 'sudoku-solver', 'H'],
  ],
  trees: [
    ['Minimum Depth of Binary Tree', 'minimum-depth-of-binary-tree', 'E'], ['Binary Tree Preorder Traversal', 'binary-tree-preorder-traversal', 'E'], ['Binary Tree Postorder Traversal', 'binary-tree-postorder-traversal', 'E'],
    ['Count Complete Tree Nodes', 'count-complete-tree-nodes', 'E'], ['Binary Tree Paths', 'binary-tree-paths', 'E'], ['Sum of Left Leaves', 'sum-of-left-leaves', 'E'],
    ['Binary Tree Zigzag Level Order Traversal', 'binary-tree-zigzag-level-order-traversal', 'M'], ['Path Sum II', 'path-sum-ii', 'M'], ['Sum Root to Leaf Numbers', 'sum-root-to-leaf-numbers', 'M'],
    ['Flatten Binary Tree to Linked List', 'flatten-binary-tree-to-linked-list', 'M'], ['Populating Next Right Pointers in Each Node', 'populating-next-right-pointers-in-each-node', 'M'],
    ['Count Good Nodes in Binary Tree', 'count-good-nodes-in-binary-tree', 'M'], ['Maximum Width of Binary Tree', 'maximum-width-of-binary-tree', 'M'], ['All Nodes Distance K in Binary Tree', 'all-nodes-distance-k-in-binary-tree', 'M'],
  ],
  bst: [
    ['Search in a Binary Search Tree', 'search-in-a-binary-search-tree', 'E'], ['Range Sum of BST', 'range-sum-of-bst', 'E'], ['Minimum Absolute Difference in BST', 'minimum-absolute-difference-in-bst', 'E'],
    ['Two Sum IV - Input is a BST', 'two-sum-iv-input-is-a-bst', 'E'], ['Trim a Binary Search Tree', 'trim-a-binary-search-tree', 'M'], ['Binary Search Tree Iterator', 'binary-search-tree-iterator', 'M'], ['Recover Binary Search Tree', 'recover-binary-search-tree', 'M'],
  ],
  heaps: [
    ['Kth Largest Element in a Stream', 'kth-largest-element-in-a-stream', 'E'], ['Top K Frequent Words', 'top-k-frequent-words', 'M'], ['Sort Characters By Frequency', 'sort-characters-by-frequency', 'M'],
    ['Reorganize String', 'reorganize-string', 'M'], ['Find K Pairs with Smallest Sums', 'find-k-pairs-with-smallest-sums', 'M'], ['Ugly Number II', 'ugly-number-ii', 'M'], ['Furthest Building You Can Reach', 'furthest-building-you-can-reach', 'M'], ['IPO', 'ipo', 'H'],
  ],
  graphs: [
    ['Find the Town Judge', 'find-the-town-judge', 'E'], ['Find Center of Star Graph', 'find-center-of-star-graph', 'E'], ['Keys and Rooms', 'keys-and-rooms', 'M'], ['Number of Provinces', 'number-of-provinces', 'M'],
    ['All Paths From Source to Target', 'all-paths-from-source-to-target', 'M'], ['01 Matrix', '01-matrix', 'M'], ['Shortest Path in Binary Matrix', 'shortest-path-in-binary-matrix', 'M'], ['Open the Lock', 'open-the-lock', 'M'],
    ['Accounts Merge', 'accounts-merge', 'M'], ['Evaluate Division', 'evaluate-division', 'M'], ['Minimum Height Trees', 'minimum-height-trees', 'M'], ['Path With Minimum Effort', 'path-with-minimum-effort', 'M'],
    ['Min Cost to Connect All Points', 'min-cost-to-connect-all-points', 'M'], ['Snakes and Ladders', 'snakes-and-ladders', 'M'], ['Swim in Rising Water', 'swim-in-rising-water', 'H'], ['Reconstruct Itinerary', 'reconstruct-itinerary', 'H'],
  ],
  dp: [
    ['Fibonacci Number', 'fibonacci-number', 'E'], ['N-th Tribonacci Number', 'n-th-tribonacci-number', 'E'], ['Perfect Squares', 'perfect-squares', 'M'], ['Minimum Path Sum', 'minimum-path-sum', 'M'],
    ['Unique Paths II', 'unique-paths-ii', 'M'], ['Triangle', 'triangle', 'M'], ['Minimum Falling Path Sum', 'minimum-falling-path-sum', 'M'], ['Maximal Square', 'maximal-square', 'M'],
    ['Longest Palindromic Subsequence', 'longest-palindromic-subsequence', 'M'], ['Coin Change II', 'coin-change-ii', 'M'], ['Combination Sum IV', 'combination-sum-iv', 'M'], ['Delete Operation for Two Strings', 'delete-operation-for-two-strings', 'M'],
    ['Best Time to Buy and Sell Stock with Cooldown', 'best-time-to-buy-and-sell-stock-with-cooldown', 'M'], ['Longest String Chain', 'longest-string-chain', 'M'], ['House Robber III', 'house-robber-iii', 'M'],
    ['Unique Binary Search Trees', 'unique-binary-search-trees', 'M'], ['Interleaving String', 'interleaving-string', 'M'], ['Last Stone Weight II', 'last-stone-weight-ii', 'M'], ['Ones and Zeroes', 'ones-and-zeroes', 'M'],
    ['Distinct Subsequences', 'distinct-subsequences', 'H'], ['Burst Balloons', 'burst-balloons', 'H'], ['Regular Expression Matching', 'regular-expression-matching', 'H'], ['Russian Doll Envelopes', 'russian-doll-envelopes', 'H'],
  ],
  greedy: [
    ['Maximum Units on a Truck', 'maximum-units-on-a-truck', 'E'], ['Best Time to Buy and Sell Stock II', 'best-time-to-buy-and-sell-stock-ii', 'M'], ['Boats to Save People', 'boats-to-save-people', 'M'],
    ['Two City Scheduling', 'two-city-scheduling', 'M'], ['Minimum Number of Arrows to Burst Balloons', 'minimum-number-of-arrows-to-burst-balloons', 'M'], ['Hand of Straights', 'hand-of-straights', 'M'],
    ['Valid Parenthesis String', 'valid-parenthesis-string', 'M'], ['Queue Reconstruction by Height', 'queue-reconstruction-by-height', 'M'], ['Remove Duplicate Letters', 'remove-duplicate-letters', 'M'], ['Candy', 'candy', 'H'],
  ],
  bits: [
    ['Hamming Distance', 'hamming-distance', 'E'], ['Palindrome Number', 'palindrome-number', 'E'], ['Fizz Buzz', 'fizz-buzz', 'E'], ['Add Digits', 'add-digits', 'E'], ['Power of Three', 'power-of-three', 'E'],
    ['Excel Sheet Column Number', 'excel-sheet-column-number', 'E'], ['Reverse Integer', 'reverse-integer', 'M'], ['Factorial Trailing Zeroes', 'factorial-trailing-zeroes', 'M'], ['Single Number II', 'single-number-ii', 'M'],
    ['Bitwise AND of Numbers Range', 'bitwise-and-of-numbers-range', 'M'], ['Divide Two Integers', 'divide-two-integers', 'M'], ['Gray Code', 'gray-code', 'M'], ['Integer Break', 'integer-break', 'M'],
  ],
  tries: [
    ['Replace Words', 'replace-words', 'M'], ['Map Sum Pairs', 'map-sum-pairs', 'M'], ['Implement Magic Dictionary', 'implement-magic-dictionary', 'M'], ['Search Suggestions System', 'search-suggestions-system', 'M'],
    ['Maximum XOR of Two Numbers in an Array', 'maximum-xor-of-two-numbers-in-an-array', 'M'],
  ],
}
DSA_TOPICS.forEach((t) => t.problems.push(...P(MORE[t.id] || [])))

DSA_TOPICS.push({
  id: 'design', name: 'Design & Data Structures', blurb: 'Build a small system with the right data structure. Directly relevant to your URL shortener and cache projects.',
  learn: ['Pick the structure by the operations needed', 'Hash map + doubly linked list (LRU)', 'Amortised O(1)'],
  problems: P([
    ['Design Parking System', 'design-parking-system', 'E'], ['Design Browser History', 'design-browser-history', 'M'], ['Encode and Decode TinyURL', 'encode-and-decode-tinyurl', 'M'],
    ['Insert Delete GetRandom O(1)', 'insert-delete-getrandom-o1', 'M'], ['Design Circular Queue', 'design-circular-queue', 'M'], ['Time Based Key-Value Store', 'time-based-key-value-store', 'M'],
    ['Design Twitter', 'design-twitter', 'M'], ['Design Underground System', 'design-underground-system', 'M'], ['LFU Cache', 'lfu-cache', 'H'],
  ]),
})

// SQL is a side track: not in the daily DSA plan, practised via the Learn → SQL lessons and here.
DSA_TOPICS.push({
  id: 'sql', side: true, name: 'SQL Practice', blurb: 'Database questions appear in most backend and data screens. Do 2–3 a week alongside the DSA plan.',
  learn: ['SELECT / WHERE / ORDER BY', 'JOINs and GROUP BY', 'Subqueries, window functions'],
  problems: P([
    ['Big Countries', 'big-countries', 'E'], ['Combine Two Tables', 'combine-two-tables', 'E'], ['Duplicate Emails', 'duplicate-emails', 'E'], ['Customers Who Never Order', 'customers-who-never-order', 'E'],
    ['Employees Earning More Than Their Managers', 'employees-earning-more-than-their-managers', 'E'], ['Rising Temperature', 'rising-temperature', 'E'], ['Delete Duplicate Emails', 'delete-duplicate-emails', 'E'],
    ['Find Customer Referee', 'find-customer-referee', 'E'], ['Not Boring Movies', 'not-boring-movies', 'E'], ['Swap Salary', 'swap-salary', 'E'], ['Product Sales Analysis I', 'product-sales-analysis-i', 'E'],
    ['Game Play Analysis I', 'game-play-analysis-i', 'E'], ['Second Highest Salary', 'second-highest-salary', 'M'], ['Nth Highest Salary', 'nth-highest-salary', 'M'], ['Rank Scores', 'rank-scores', 'M'],
    ['Consecutive Numbers', 'consecutive-numbers', 'M'], ['Department Highest Salary', 'department-highest-salary', 'M'], ['Exchange Seats', 'exchange-seats', 'M'],
    ['Managers with at Least 5 Direct Reports', 'managers-with-at-least-5-direct-reports', 'M'], ['Classes More Than 5 Students', 'classes-more-than-5-students', 'E'],
    ['Department Top Three Salaries', 'department-top-three-salaries', 'H'], ['Trips and Users', 'trips-and-users', 'H'],
  ]),
})

const withTopic = (t) => t.problems.map((p) => ({ ...p, topicId: t.id, topic: t.name, side: !!t.side }))
export const ALL_PROBLEMS_FULL = DSA_TOPICS.flatMap(withTopic)
// Core sheet = what the daily plan walks through (SQL is a side track)
export const ALL_PROBLEMS = DSA_TOPICS.filter((t) => !t.side).flatMap(withTopic)
export const PROBLEM_BY_ID = Object.fromEntries(ALL_PROBLEMS_FULL.map((p) => [p.id, p]))
export const problemUrl = (id) => `https://leetcode.com/problems/${id}/`
