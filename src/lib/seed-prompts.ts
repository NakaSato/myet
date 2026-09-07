// Original prompts written for this tool. Deliberately NOT copied from Cambridge
// or any official past paper — see PRD §1.3 (non-goals). Add your own freely.

export type SeedPrompt = {
  type: "task2" | "speaking_p2";
  category: string;
  text: string;
};

export const SEED_PROMPTS: SeedPrompt[] = [
  // ---- Task 2: opinion (agree/disagree) ----
  { type: "task2", category: "opinion", text: "Some people believe that universities should only admit students with the highest academic results, regardless of their background. To what extent do you agree or disagree?" },
  { type: "task2", category: "opinion", text: "Governments should spend money on public transport rather than on building new roads. To what extent do you agree or disagree?" },
  { type: "task2", category: "opinion", text: "Working from home is better for both employees and employers than working in an office. To what extent do you agree or disagree?" },
  { type: "task2", category: "opinion", text: "Children under the age of 14 should not be allowed to own a smartphone. To what extent do you agree or disagree?" },
  { type: "task2", category: "opinion", text: "The best way to reduce crime is to give young people longer education rather than longer prison sentences. To what extent do you agree or disagree?" },
  { type: "task2", category: "opinion", text: "Scientific research should be funded by governments rather than by private companies. To what extent do you agree or disagree?" },
  { type: "task2", category: "opinion", text: "It is a waste of resources to teach subjects such as history and literature to students who intend to work in science or engineering. To what extent do you agree or disagree?" },
  { type: "task2", category: "opinion", text: "Air travel should be made significantly more expensive in order to protect the environment. To what extent do you agree or disagree?" },

  // ---- Task 2: discussion (both views) ----
  { type: "task2", category: "discussion", text: "Some people think that competitive sport teaches children valuable life skills. Others believe it creates unnecessary pressure. Discuss both views and give your own opinion." },
  { type: "task2", category: "discussion", text: "Some argue that a country's culture is best preserved through museums and monuments. Others say it is preserved through everyday language and customs. Discuss both views and give your own opinion." },
  { type: "task2", category: "discussion", text: "Some people believe that artificial intelligence will create more jobs than it destroys. Others disagree. Discuss both views and give your own opinion." },
  { type: "task2", category: "discussion", text: "Some think that university education should prepare students for a specific career. Others believe its purpose is to develop general knowledge. Discuss both views and give your own opinion." },
  { type: "task2", category: "discussion", text: "Some people prefer to live in a city all their lives, while others believe moving to the countryside in later life is better. Discuss both views and give your own opinion." },
  { type: "task2", category: "discussion", text: "Some believe that parents are primarily responsible for teaching children good behaviour, while others argue schools share that duty equally. Discuss both views and give your own opinion." },
  { type: "task2", category: "discussion", text: "Some people say that news should be reported by professional journalists only. Others argue that ordinary citizens reporting online is equally valuable. Discuss both views and give your own opinion." },

  // ---- Task 2: problem / solution ----
  { type: "task2", category: "problem_solution", text: "In many large cities, traffic congestion is becoming worse every year. What are the causes of this problem, and what measures could be taken to solve it?" },
  { type: "task2", category: "problem_solution", text: "An increasing number of people report feeling lonely despite being constantly connected online. What are the reasons for this, and what can be done about it?" },
  { type: "task2", category: "problem_solution", text: "Many young people leave rural areas to work in cities. What problems does this cause, and what solutions can you suggest?" },
  { type: "task2", category: "problem_solution", text: "Obesity rates among children are rising in many countries. What are the main causes, and what steps should be taken to reverse the trend?" },
  { type: "task2", category: "problem_solution", text: "A large amount of food is wasted in households and supermarkets every year. Why does this happen, and what can governments and individuals do to reduce it?" },
  { type: "task2", category: "problem_solution", text: "Many skilled professionals emigrate from developing countries to work abroad. What problems does this create, and how might they be addressed?" },

  // ---- Task 2: advantages / disadvantages ----
  { type: "task2", category: "advantages_disadvantages", text: "More and more people are choosing to study online rather than attend classes in person. Do the advantages of this development outweigh the disadvantages?" },
  { type: "task2", category: "advantages_disadvantages", text: "In some countries, people are living much longer than in the past. Do the advantages of an ageing population outweigh the disadvantages?" },
  { type: "task2", category: "advantages_disadvantages", text: "English has become the dominant language of international business and research. Do the advantages of having one global language outweigh the disadvantages?" },
  { type: "task2", category: "advantages_disadvantages", text: "Many companies now use automated systems instead of human staff to deal with customers. Do the advantages outweigh the disadvantages?" },
  { type: "task2", category: "advantages_disadvantages", text: "Some countries encourage tourism as a way of developing their economy. Do the advantages of mass tourism outweigh the disadvantages?" },

  // ---- Task 2: two-part (direct question) ----
  { type: "task2", category: "two_part", text: "People today often change careers several times during their working lives. Why is this happening? Is it a positive or a negative development?" },
  { type: "task2", category: "two_part", text: "Many people now buy second-hand goods rather than new ones. What are the reasons for this trend? Do you think it is a positive development?" },
  { type: "task2", category: "two_part", text: "Some governments give tax reductions to families with more than two children. Why might they do this? Do you think it is an effective policy?" },
  { type: "task2", category: "two_part", text: "Fewer people are reading printed books than in the past. What has caused this change? What effect will it have on society?" },

  // ---- Official IELTS published sample Task 2 questions ----
  // Source: "IELTS Academic Writing - Sample Tasks" (2023),
  // https://ielts.org/cdn/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf
  { type: "task2", category: "opinion", text: "Children who are brought up in families that do not have large amounts of money are better prepared to deal with the problems of adult life than children brought up by wealthy parents.\n\nTo what extent do you agree or disagree with this opinion?" },
  { type: "task2", category: "advantages_disadvantages", text: "International tourism has brought enormous benefit to many places. At the same time, there is concern about its impact on local inhabitants and the environment.\n\nDo the disadvantages of international tourism outweigh the advantages?" },

  // ---- Speaking Part 2 cue cards (P1 module) ----
  { type: "speaking_p2", category: "person", text: "Describe a person who has influenced the way you work or study.\nYou should say:\n- who this person is\n- how you know them\n- what they taught you\nand explain why their influence mattered to you." },
  { type: "speaking_p2", category: "place", text: "Describe a place you go to when you want to concentrate.\nYou should say:\n- where it is\n- how often you go there\n- what you do there\nand explain why it helps you focus." },
  { type: "speaking_p2", category: "object", text: "Describe a piece of technology you find difficult to use.\nYou should say:\n- what it is\n- when you started using it\n- what problems you have with it\nand explain how you deal with those problems." },
  { type: "speaking_p2", category: "experience", text: "Describe a time when you had to make a difficult decision.\nYou should say:\n- what the decision was\n- what the options were\n- how long it took you to decide\nand explain how you felt afterwards." },
  { type: "speaking_p2", category: "experience", text: "Describe a skill you learned that took a long time to master.\nYou should say:\n- what the skill is\n- why you decided to learn it\n- how you practised\nand explain how useful it has been." },
  { type: "speaking_p2", category: "media", text: "Describe an article or video that taught you something useful.\nYou should say:\n- what it was about\n- where you found it\n- what you learned\nand explain why you would recommend it to others." },
  { type: "speaking_p2", category: "event", text: "Describe an occasion when you had to speak in front of other people.\nYou should say:\n- what the occasion was\n- who was listening\n- what you talked about\nand explain how you prepared for it." },
  { type: "speaking_p2", category: "plan", text: "Describe a goal you would like to achieve in the next five years.\nYou should say:\n- what the goal is\n- why you chose it\n- what steps you have already taken\nand explain what might stop you from achieving it." },
];
