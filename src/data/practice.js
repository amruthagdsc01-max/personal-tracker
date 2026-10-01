// Aptitude question bank (answers hand-checked) + communication prompts.
import { MORE_APT, MORE_SPEAK } from './practiceMore.js'

const Q =(id, topic, q, options, answer, why) => ({ id, topic, q, options, answer, why })

export const APT_TOPICS = { quant: 'Quantitative', logical: 'Logical reasoning', verbal: 'Verbal' }

const BASE_APT = [
  Q('q1', 'quant', 'What is 20% of 250?', ['40', '50', '60', '45'], 1, '250 × 20/100 = 50.'),
  Q('q2', 'quant', 'A shirt priced ₹800 is sold at 15% discount. What is the selling price?', ['₹660', '₹680', '₹700', '₹720'], 1, '15% of 800 = 120, so 800 − 120 = 680.'),
  Q('q3', 'quant', 'Two numbers are in the ratio 3:5 and their sum is 160. What is the larger number?', ['60', '90', '100', '120'], 2, 'Total parts 8 → one part 20 → larger = 5 × 20 = 100.'),
  Q('q4', 'quant', 'A train moves at 60 km/h. How far does it travel in 2 hours 30 minutes?', ['120 km', '140 km', '150 km', '180 km'], 2, 'Distance = 60 × 2.5 = 150 km.'),
  Q('q5', 'quant', 'A can finish a job in 12 days and B in 6 days. Working together, how many days?', ['3', '4', '5', '6'], 1, 'Rate = 1/12 + 1/6 = 3/12 = 1/4 → 4 days.'),
  Q('q6', 'quant', 'Simple interest on ₹5000 at 8% per annum for 3 years?', ['₹1000', '₹1200', '₹1400', '₹1600'], 1, 'SI = P×R×T/100 = 5000×8×3/100 = 1200.'),
  Q('q7', 'quant', 'Cost price ₹400, selling price ₹500. Profit percentage?', ['20%', '25%', '30%', '15%'], 1, 'Profit 100 on cost 400 → 25%.'),
  Q('q8', 'quant', 'Average of 10, 20, 30, 40, 50?', ['25', '30', '35', '40'], 1, 'Sum 150 ÷ 5 = 30.'),
  Q('q9', 'quant', 'Next in the series 2, 6, 12, 20, 30, ?', ['40', '42', '44', '36'], 1, 'Differences 4,6,8,10 → next difference 12 → 42.'),
  Q('q10', 'quant', 'Probability that the sum of two fair dice is 7?', ['1/12', '1/6', '1/9', '5/36'], 1, '6 favourable outcomes out of 36 = 1/6.'),
  Q('q11', 'quant', 'In how many ways can the letters of "CAT" be arranged?', ['3', '6', '9', '12'], 1, '3! = 6.'),
  Q('q12', 'quant', 'A boat does 15 km/h in still water; the stream flows at 5 km/h. Time to go 20 km downstream?', ['1 hour', '1.5 hours', '2 hours', '45 minutes'], 0, 'Downstream speed 20 km/h → 20 km takes 1 hour.'),
  Q('q13', 'quant', 'If x + y = 10 and xy = 21, what is x² + y²?', ['48', '58', '62', '68'], 1, '(x+y)² − 2xy = 100 − 42 = 58.'),
  Q('q14', 'quant', 'LCM of 12 and 18?', ['36', '72', '54', '6'], 0, '12 = 2²·3, 18 = 2·3² → LCM = 2²·3² = 36.'),
  Q('q15', 'quant', 'Pipe A fills a tank in 10 h; pipe B empties it in 15 h. Both open: time to fill?', ['25 h', '30 h', '35 h', '45 h'], 1, 'Net rate 1/10 − 1/15 = 1/30 → 30 h.'),
  Q('q16', 'quant', 'Area of a circle of radius 7 (use π = 22/7)?', ['144', '154', '164', '44'], 1, 'πr² = 22/7 × 49 = 154.'),
  Q('q17', 'quant', 'A number is increased by 25% and then decreased by 20%. Net change?', ['Increase 5%', 'Decrease 5%', 'No change', 'Increase 2%'], 2, '1.25 × 0.80 = 1.00.'),
  Q('q18', 'quant', '8 men build a wall in 15 days. How many days will 12 men take?', ['8', '10', '12', '9'], 1, 'Work = 120 man-days; 120 ÷ 12 = 10.'),
  Q('q19', 'logical', 'Odd one out: Apple, Banana, Carrot, Mango', ['Apple', 'Banana', 'Carrot', 'Mango'], 2, 'Carrot is a vegetable; the rest are fruits.'),
  Q('q20', 'logical', 'All engineers are logical. All logical people are curious. Therefore:', ['All engineers are curious', 'All curious people are engineers', 'Some engineers are not logical', 'No conclusion'], 0, 'Engineers ⊂ logical ⊂ curious.'),
  Q('q21', 'logical', 'Next number: 1, 4, 9, 16, ?', ['20', '24', '25', '36'], 2, 'Squares: 1², 2², 3², 4², 5² = 25.'),
  Q('q22', 'logical', 'Walk 5 km north, 3 km east, then 5 km south. How far from the start?', ['3 km', '5 km', '8 km', '13 km'], 0, 'North and south cancel; only the 3 km east remains.'),
  Q('q23', 'logical', 'Pointing to a man, Anu says "his mother is the only daughter of my mother." The man is Anu’s:', ['Brother', 'Son', 'Nephew', 'Cousin'], 1, 'Anu’s mother’s only daughter is Anu herself, so the man is Anu’s son.'),
  Q('q24', 'logical', 'Angle between the hands of a clock at 3:00?', ['60°', '90°', '120°', '75°'], 1, 'Each hour mark = 30°; 3 hours = 90°.'),
  Q('q25', 'logical', 'Complete the pattern: AZ, BY, CX, ?', ['DV', 'DW', 'EW', 'CW'], 1, 'First letter moves forward, second moves backward: D, W.'),
  Q('q26', 'logical', 'Today is Monday. What day will it be after 100 days?', ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], 1, '100 mod 7 = 2 → Monday + 2 = Wednesday.'),
  Q('q27', 'logical', 'Odd one out: 2, 5, 9, 11', ['2', '5', '9', '11'], 2, '9 is not prime.'),
  Q('q28', 'logical', 'Ravi is taller than Sam. Sam is taller than Tom. Who is the shortest?', ['Ravi', 'Sam', 'Tom', 'Cannot say'], 2, 'Ravi > Sam > Tom.'),
  Q('q29', 'verbal', 'Choose the correct word: "She ___ to the market yesterday."', ['go', 'goes', 'went', 'gone'], 2, 'Past simple of "go" is "went".'),
  Q('q30', 'verbal', 'Synonym of "abundant":', ['scarce', 'plentiful', 'tiny', 'rare'], 1, 'Abundant means existing in large quantities.'),
  Q('q31', 'verbal', 'Antonym of "expand":', ['grow', 'stretch', 'contract', 'extend'], 2, 'Contract is the opposite of expand.'),
  Q('q32', 'verbal', 'Choose the correct sentence:', ['Neither of the boys are ready.', 'Neither of the boys is ready.', 'Neither of the boys were ready.', 'Neither boys is ready.'], 1, '"Neither" takes a singular verb.'),
  Q('q33', 'verbal', 'The idiom "break the ice" means:', ['Break something cold', 'Start a friendly conversation', 'End an argument', 'Feel cold'], 1, 'It means to ease the initial awkwardness among people.'),
  Q('q34', 'verbal', 'He is very good ___ mathematics.', ['in', 'at', 'on', 'with'], 1, '"Good at" is the correct preposition.'),
  Q('q35', 'verbal', 'One word for "a person who loves books":', ['Philanthropist', 'Bibliophile', 'Linguist', 'Misanthrope'], 1, 'Bibliophile = lover of books.'),
]
export const APTITUDE = [...BASE_APT, ...MORE_APT]
export const APT_BY_ID =Object.fromEntries(APTITUDE.map((q) => [q.id, q]))

export const SPEAK_TECHNIQUES = [
  'Structure: Point → Reason → Example → Point (PREP).',
  'Pace: speak 20% slower than feels natural; pause instead of saying "um".',
  'Stories: use STAR — Situation, Task, Action, Result.',
  'Clarity: one idea per sentence; no more than 3 points per answer.',
  'Introduction: 30-second pitch — who you are, what you build, what you want next.',
  'Technical explanation: start with the problem, then the solution, then the trade-off.',
  'Listening: repeat the question in your own words before answering.',
]

export const SPEAK_PROMPTS = [
  'Introduce yourself in 45 seconds as if you were in an internship interview.',
  'Explain your best project to a non-technical friend in 90 seconds.',
  'What is an API? Explain it with a restaurant analogy.',
  'Describe a time you got stuck while coding and how you got unstuck.',
  'Why do you want to become an AI / software engineer?',
  'Explain what a database index is, out loud, without jargon.',
  'Tell me about a mistake you made and what you learned.',
  'Explain Big-O notation to a first-year student.',
  'Why should a company hire you as an intern over someone with a higher CGPA?',
  'Explain how a URL shortener works.',
  'What is the difference between a process and a thread?',
  'Describe your strongest technical skill and prove it with an example.',
  'Walk me through what happens when you type a URL in the browser.',
  'Summarise what you learned today in 60 seconds.',
  'What is RAG and why is it useful?',
  'Explain what MCP is to someone who has only used chatbots.',
  'Describe a team situation where you disagreed and how you handled it.',
  'Where do you see yourself in two years, and what are you doing about it now?',
  'Explain recursion using a real-life example.',
  'Pitch your favourite project in 2 minutes: problem, solution, result.',
  'What is the difference between SQL and NoSQL? When would you choose each?',
  'Explain why testing matters to a manager who wants to ship faster.',
  'Read any tech article headline and give your opinion on it for 60 seconds.',
  'How do you learn a new technology quickly? Describe your process.',
  'Explain what Docker solves.',
  'Give feedback to a teammate whose code you reviewed — practise being kind and specific.',
  'Describe the hardest problem you solved this month.',
  'Explain REST vs GraphQL in simple terms.',
  'Tell me about yourself again — compare with your first recording. What improved?',
  'Explain what an LLM hallucination is and how you would reduce it.',
]

SPEAK_PROMPTS.push(...MORE_SPEAK)
