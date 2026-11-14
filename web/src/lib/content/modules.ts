import type { Lesson, Module } from "@/lib/types";

/*
 * The v2 program: Claude Chat, 8 modules in 4 blocks (spec/03 §2).
 * m1 is written in full (spec/03 §7); the rest exist as outlines.
 * m1–m6 run in the AIGO console (plain chat), m7–m8 in real Claude.
 *
 * Lesson strings may only use these placeholders, which the generator
 * fills in per project and profile:
 *   {projectTitle} {job} {workplace} {manager}
 * {manager} reads like "my manager, Sarah", so it is only used in the
 * player's own voice (prompts and hint answers), never in text the coach
 * says to the player.
 */

// ───────────────────────── m1 materials ─────────────────────────

const M1_2_NOTES = `mon - inbox chaos, sorted ~40 supplier emails, flagged 3 invoices w/ wrong amounts
tue: new starter (Tom) onboarding, laptop not ready til 2pm!! fixed w/ IT
wed - booked venue for team offsite Dec 12, quote $1,850, approved by finance
thu: 2nd floor printer broken AGAIN. service call logged, tech coming Mon
also switched paper supplier, saves ~$40/month
fri - started December holiday rota, still missing dates from 2 people`;

const M1_3_NOTES = `Ops sync, Tue 10:00. Present: me, Ana (ops lead), Dev (IT), Maria (finance), Luis (facilities)
- room booking: Dev sets up a trial of the new booking tool by Nov 21
- Q1 supplies budget: Maria needs final numbers from me by Fri Nov 22
- kitchen leak again!! Luis to call the plumber, by Nov 20
- Ana wants a 1-page summary of the new visitor policy for all staff. me, by Nov 28
- holiday party: still no venue. me + Luis shortlist 3 venues by Dec 2
- next sync in 2 weeks`;

const M1_BOSS_NOTES = `Mon: closed 2 open supplier tickets. new cleaning contract signed, starts Dec 1
Tue: onboarded 2 new hires, both fully set up by noon. drafted 3rd floor desk plan
Wed: fire drill done, evacuation 4 min. 2 exits blocked by boxes -> cleared same day
Thu: invoice backlog down from 31 to 9. badge reader at side door still broken (IT ticket #4471, open 2 weeks)
Fri: started Q1 supplies budget. need last year's figures from finance, asked twice, no reply
next week: get desk plan approved, close the last 9 invoices, Q1 budget draft by Thu`;

// ───────────────────────── m1 The Clear Ask (full) ─────────────────────────

const M1_LESSONS: Lesson[] = [
  {
    id: "m1.1",
    title: "The Brief Formula",
    kind: "lesson",
    mission: "Write a request Claude answers well on the first try.",
    brief:
      "A vague ask gets a vague answer, and then you spend five messages fixing it. A strong ask has three parts. Context: who you are and what is going on. Goal: what the text must achieve and for whom. Format: how long, how it is structured, what tone. Put all three in one message and Claude usually gets it right the first time. This is the base skill for {projectTitle}: every email, report and summary you build later starts with a clear ask.",
    watchMe:
      "Show the difference yourself and write both answers, each under 80 words. First answer the weak ask \"Write an email to my boss.\" and point out that you had to guess the topic, the tone and the length. Then answer the strong ask \"I'm the {job} at {workplace}. Write a short email to {manager}, asking to move Thursday's check-in to Friday because of a supplier visit. Friendly, under 80 words, with a subject line.\" Finish with one line each on what the context, the goal and the format changed.",
    yourTurn:
      "Fill in every blank and send it: \"I'm the ___ at ___. Write ___ to ___ so that ___. Format: ___.\"",
    solo:
      "Now write the whole prompt yourself, no template. Ask Claude for an email to your manager requesting a 30-minute 1:1 next week to talk about your growth path. Make sure it has context, goal and format.",
    check: {
      checklist: [
        "Context: who the player is and their situation (role, workplace)",
        "Goal: what the email must achieve (a 1:1 about growth with the manager)",
        "Format: length, structure or tone stated explicitly",
      ],
      result:
        "The email asks the manager clearly for a 1:1 about growth, follows the stated length and tone, and invents no facts the player did not give.",
    },
    quiz: {
      prompt: "Which three parts make a strong ask?",
      options: [
        "Politeness, a deadline and a word count",
        "Context, goal and format",
        "A role, an example and a template",
      ],
      answer: 1,
    },
    techniques: ["1"],
    hints: {
      mission: { todo: "Read the mission and say you're ready.", answer: "Ready, let's go." },
      brief: { todo: "Read the formula, then ask Claude to show it.", answer: "Got it. Show me the difference." },
      watchMe: { todo: "Compare the weak and the strong answer, then ask to try.", answer: "Got it. Let me try." },
      yourTurn: {
        todo: "Fill in every blank of the template and send it.",
        answer:
          "I'm the {job} at {workplace}. Write a short thank-you message to my team so that they know their extra effort during last week's busy period was noticed. Format: 3 to 4 sentences, warm but professional, ready to post in our team chat.",
      },
      solo: {
        todo: "Send a full prompt with context, goal and format.",
        answer:
          "I'm the {job} at {workplace}. Write a short email to {manager}, asking for a 30-minute 1:1 next week to talk about my growth path. Friendly but professional, under 120 words, with a clear subject line.",
      },
      check: { todo: "Read Claude's check against the checklist, then continue.", answer: "Thanks, looks good. What's next?" },
      clear: { todo: "Lesson cleared: go on to the next one.", answer: "Next lesson" },
    },
  },
  {
    id: "m1.2",
    title: "Ask for the Shape",
    kind: "lesson",
    mission: "Get the answer in the shape you need straight away.",
    brief:
      "Claude cannot guess whether you want three bullets or a full page, a casual note or a formal update. If you don't say, it picks for you, and you spend the next messages typing 'shorter' and 'more formal'. So state the shape up front: length (5 bullets, under 80 words), structure (bullets, a table, a headline plus a paragraph) and tone (business, friendly, neutral). Managers read updates in seconds, and the right shape is what makes yours land. It is how {projectTitle} texts come out ready to send.",
    watchMe:
      "Show the difference yourself on a tiny set of notes: \"new coffee machine ordered, arrives Tue; parking permits renewed for 12 people; fire drill moved to the 28th\". Keep each answer short. First answer the weak ask \"Make a report from these notes.\" and point out the length, order and tone you had to guess. Then answer the strong ask \"Turn these notes into 3 bullet points for my manager, under 40 words, neutral business tone.\" Finish with one line on why the second answer needs no rework.",
    yourTurn:
      "Add the format to this ready request by filling every blank, then send it: \"I'm the {job} at {workplace}. Write a reminder to the team that the office closes at 3 pm this Friday for maintenance. Length: ___. Structure: ___. Tone: ___.\"",
    solo:
      "Turn the notes in the Material section into 5 bullet points for your manager. Write the whole prompt yourself: say who it is for, state the length, structure and tone, and paste the notes in full.",
    material: M1_2_NOTES,
    check: {
      checklist: [
        "Context: who the update is for and why",
        "Length: stated explicitly (for example 5 bullets, under 80 words)",
        "Structure and tone: both stated explicitly",
        "Material: the notes are pasted in full",
      ],
      result:
        "Exactly 5 bullet points within the stated length and tone, built only from the notes, with nothing invented.",
    },
    quiz: {
      prompt: "Your manager will read your update on the phone between meetings. Which ask is best?",
      options: [
        "Write an update about my week.",
        "Write a detailed, really good update about my week.",
        "Write a 5-bullet update about my week, under 80 words, business tone.",
      ],
      answer: 2,
    },
    techniques: ["2"],
    hints: {
      mission: { todo: "Read the mission and say you're ready.", answer: "Ready." },
      brief: { todo: "Read why the shape matters, then ask for the demo.", answer: "Makes sense. Show me." },
      watchMe: { todo: "Compare both answers, then ask to try.", answer: "I see the difference. Let me try." },
      yourTurn: {
        todo: "Fill in length, structure and tone, then send.",
        answer:
          "I'm the {job} at {workplace}. Write a reminder to the team that the office closes at 3 pm this Friday for maintenance. Length: under 60 words. Structure: a one-line headline, then two short sentences on what changes and what to do. Tone: friendly and clear.",
      },
      solo: {
        todo: "Send a full prompt with the format stated and the notes pasted in.",
        answer: `I'm the {job} at {workplace}. Turn my notes from this week into a quick update for {manager}, so they can see at a glance what I handled. Format: exactly 5 bullet points, one line each, under 80 words in total, most important first. Tone: clear business tone, no fluff. Use only what is in my notes.

My notes:
${M1_2_NOTES}`,
      },
      check: { todo: "Read Claude's check, then continue.", answer: "Great, that works. What's next?" },
      clear: { todo: "Lesson cleared: go on to the next one.", answer: "Next lesson" },
    },
  },
  {
    id: "m1.3",
    title: "Give It the Material",
    kind: "lesson",
    mission: "Give Claude your actual material instead of retelling it.",
    brief:
      "Ask Claude to summarize a meeting it never saw and it fills the gaps with plausible guesses, and guesses about who does what by when are risky. Paste the real thing: your notes, the email thread, the table. Then Claude works with your facts, keeps names and dates exactly as written, and can point out what is missing. Clear action items sent within the hour of a meeting are a quick, visible win at work, and they go straight into {projectTitle}.",
    watchMe:
      "Show the difference yourself; keep each answer short. First answer the weak ask \"Summarize my meeting from this morning.\" with no notes: write a plausible but generic summary, then say plainly that every detail in it was guessed. Then answer the strong ask \"Summarize this meeting in 3 bullets. Notes: budget review moved to Dec 3; Ana books the room; Ben sends the slides by Monday.\" Finish with one line: with the material, nothing had to be invented.",
    yourTurn:
      "Fill in every blank and send it: \"Here are my notes from ___. Turn them into ___ for ___. Use only what is in the notes. My notes: ___\"",
    solo:
      "Turn the meeting notes in the Material section into a table with three columns: Task, Owner, Due date. Write the whole prompt yourself and paste the notes in full.",
    material: M1_3_NOTES,
    check: {
      checklist: [
        "Context: what the notes are (a team meeting) and who the result is for",
        "Goal: pull out the action items",
        "Format: a table with columns Task, Owner, Due date",
        "Material: the meeting notes are pasted in full",
      ],
      result:
        "The table lists all 5 action items from the notes with owners and dates exactly as written; nothing is invented, and anything unclear is flagged rather than guessed.",
    },
    quiz: {
      prompt: "Why paste your meeting notes instead of describing the meeting in a sentence?",
      options: [
        "Claude works from your real names, dates and owners instead of guessing them",
        "Pasted text always makes the answer longer",
        "Claude refuses to summarize anything without a paste",
      ],
      answer: 0,
    },
    techniques: ["3"],
    hints: {
      mission: { todo: "Read the mission and say you're ready.", answer: "I'm ready." },
      brief: { todo: "Read why material beats retelling, then ask for the demo.", answer: "Clear. Go ahead and show me." },
      watchMe: { todo: "Compare the guessed and the grounded answer, then ask to try.", answer: "Got it. My turn." },
      yourTurn: {
        todo: "Fill in every blank, including short notes, and send.",
        answer:
          "Here are my notes from a call with our cleaning supplier. Turn them into a 3-line summary for {manager}. Use only what is in the notes. My notes: the price goes up 5% from January; they offer a fortnightly deep clean instead of a weekly one, which saves $120 a month; they need our answer by November 28.",
      },
      solo: {
        todo: "Send a full prompt asking for the table, with the notes pasted in.",
        answer: `I'm the {job} at {workplace}. Below are my notes from this morning's ops meeting. Pull out every action item so I can send a follow-up to everyone who attended. Format: a table with three columns: Task, Owner, Due date. One row per action item, with owners and dates exactly as in the notes. If something is unclear, flag it instead of guessing.

My notes:
${M1_3_NOTES}`,
      },
      check: { todo: "Read Claude's check, then continue.", answer: "Thanks, looks good. What's next?" },
      clear: { todo: "Lesson cleared: go on to the final challenge.", answer: "Next lesson" },
    },
  },
  {
    id: "m1.boss",
    title: "Weekly Report",
    kind: "boss",
    mission: "Turn a week of raw notes into a report your manager can read in one minute.",
    brief:
      "Final challenge: everything from this module in one prompt. Context: who you are and that this is your weekly report. Goal: what your manager should take away. Format: under 150 words, three sections: Done, Next, Blockers. Material: the week's notes, pasted in full. A sharp weekly report is one of the most visible things you write: it shows what you deliver and flags problems early, and over time it becomes your track record. It is the first finished piece of {projectTitle}.",
    watchMe:
      "No full demo for the final challenge. Recap in four short lines what a strong ask contains (context, goal, format, material), each with a tiny example that is not about a weekly report. Then say the player writes the whole prompt alone: you will answer questions about the rules but give no hints about the prompt itself.",
    yourTurn:
      "No blanks this time. Before writing the prompt, plan it: reply with one line each for your context, your goal and your format.",
    solo:
      "Write the whole prompt yourself: turn the week's notes in the Material section into a report for your manager, under 150 words, with three sections: Done, Next, Blockers. Paste the notes in full.",
    material: M1_BOSS_NOTES,
    check: {
      checklist: [
        "Context: who the player is and that this is a weekly report for the manager",
        "Goal: what the manager should take away from the report",
        "Format: under 150 words, with sections Done, Next, Blockers",
        "Material: the week's notes are pasted in full",
      ],
      result:
        "The report is under 150 words, has exactly the sections Done, Next and Blockers, puts every item in the right section, keeps numbers and dates as in the notes, and invents nothing.",
    },
    quiz: {
      prompt: "Your report came back too long and without a Blockers section. What was most likely missing from your ask?",
      options: [
        "The notes",
        "A polite greeting",
        "The format: length and sections",
      ],
      answer: 2,
    },
    techniques: ["1", "2", "3"],
    hints: {
      mission: { todo: "Read the final challenge mission and say you're ready.", answer: "Ready for the final challenge." },
      brief: { todo: "Read the rules of the fight, then continue.", answer: "Understood. Let's go." },
      watchMe: { todo: "Read the recap, then say you'll write it alone.", answer: "Got it. Let me try." },
      yourTurn: {
        todo: "Reply with your plan: one line each for context, goal and format.",
        answer:
          "Context: I'm the {job} at {workplace}, and this is my weekly report. Goal: show {manager} what I finished, what comes next and what is blocked. Format: under 150 words, three sections (Done, Next, Blockers), plain business tone, with my notes pasted in full.",
      },
      solo: {
        todo: "Send your full prompt with the week's notes pasted in.",
        answer: `I'm the {job} at {workplace}. Write my weekly report for {manager}, so they can see in one minute what I finished, what comes next and where I need help. Format: under 150 words, three sections with the headings Done, Next and Blockers, short bullet points, plain business tone. Keep all numbers and dates exactly as in my notes and add nothing that is not in them.

My notes:
${M1_BOSS_NOTES}`,
      },
      check: { todo: "Read Claude's verdict on the final challenge, then continue.", answer: "Thanks, that's a report I'd send. What's next?" },
      clear: { todo: "Set done: take the TEST card to get your score.", answer: "Thanks! I'm ready for the test." },
    },
  },
];

// ───────────────────────── Program ─────────────────────────

export const MODULES: readonly Module[] = [
  {
    id: "m1",
    title: "The Clear Ask",
    block: "Ask",
    teaches: "The brief formula: context + goal + format, an explicit shape, and your own material in the prompt.",
    runsIn: "console",
    techniques: ["1", "2", "3"],
    flavor: { learn: "Ask once. Get it right.", test: "Prove it in five tasks." },
    lessons: M1_LESSONS,
    outline: [
      {
        id: "m1.1",
        title: "The Brief Formula",
        goal: "Ask for an email to your manager about a growth conversation using context, goal and format.",
      },
      {
        id: "m1.2",
        title: "Ask for the Shape",
        goal: "Turn a week of messy notes into 5 bullets for your manager by stating length, structure and tone.",
      },
      {
        id: "m1.3",
        title: "Give It the Material",
        goal: "Paste real meeting notes and get a task table with owners and due dates, nothing invented.",
      },
      {
        id: "m1.boss",
        title: "Weekly Report",
        goal: "Write a weekly report under 150 words with Done, Next and Blockers from a week of raw notes.",
      },
    ],
    review: {
      prompt: "You want Claude to summarize yesterday's meeting. What's the best ask?",
      options: [
        "\"Summarize my meeting from yesterday.\"",
        "Your role and why you need it, the format you want, and the meeting notes pasted in full",
        "\"Summarize the meeting, be very accurate.\"",
      ],
      answer: 1,
    },
  },
  {
    id: "m2",
    title: "Iterate",
    block: "Ask",
    teaches: "Refine an answer with targeted follow-ups and ask for options instead of starting over.",
    runsIn: "console",
    techniques: ["4", "5"],
    outline: [
      {
        id: "m2.1",
        title: "Fix, Don't Restart",
        goal: "Improve one part of your email to your manager with a targeted follow-up instead of a new chat.",
      },
      {
        id: "m2.2",
        title: "Give Me Options",
        goal: "Ask for three versions of the email in different tones and compare them side by side.",
      },
      {
        id: "m2.3",
        title: "Pick and Polish",
        goal: "Choose the best version, borrow the strongest lines from the others, and tighten it.",
      },
      {
        id: "m2.boss",
        title: "Three Drafts",
        goal: "Produce three versions of the growth-conversation email, pick one and finish it in two follow-ups.",
      },
    ],
    review: {
      prompt: "The answer is almost right, but the second paragraph is too stiff. What do you do?",
      options: [
        "Open a new chat and ask again from scratch",
        "Ask Claude to rewrite only the second paragraph in a warmer tone and keep the rest",
        "Copy the text out and fix it by hand",
      ],
      answer: 1,
    },
  },
  {
    id: "m3",
    title: "Show, Don't Tell",
    block: "Shape",
    teaches: "Examples, templates and roles: show Claude what good looks like instead of describing it.",
    runsIn: "console",
    techniques: ["6", "7"],
    outline: [
      {
        id: "m3.1",
        title: "Show an Example",
        goal: "Paste a report your manager liked and ask Claude to match its length, tone and structure.",
      },
      {
        id: "m3.2",
        title: "Fill the Template",
        goal: "Give Claude a template with headings and let it fill them from your notes.",
      },
      {
        id: "m3.3",
        title: "Give It a Role",
        goal: "Ask Claude to read your draft as an experienced editor, then as your manager, and compare the feedback.",
      },
      {
        id: "m3.boss",
        title: "The Boss's Style",
        goal: "Write a report in exactly the style your manager likes, using an example, a template and a role.",
      },
    ],
    review: {
      prompt: "You keep saying \"no, more like the last one\". What ends the back-and-forth fastest?",
      options: [
        "Paste an example you like and ask Claude to match it",
        "Repeat the request in capital letters",
        "Ask for a longer answer",
      ],
      answer: 0,
    },
  },
  {
    id: "m4",
    title: "Structure",
    block: "Shape",
    teaches: "Build long documents step by step: outline first, then sections, tables and headings.",
    runsIn: "console",
    techniques: ["8"],
    outline: [
      {
        id: "m4.1",
        title: "Outline First",
        goal: "Agree on an outline for a long document before any of the text is written.",
      },
      {
        id: "m4.2",
        title: "Section by Section",
        goal: "Write a long document one section at a time while keeping the whole in view.",
      },
      {
        id: "m4.3",
        title: "Tables and Headings",
        goal: "Turn a list of tasks and numbers into a clear table with headings.",
      },
      {
        id: "m4.boss",
        title: "Full Weekly Report",
        goal: "Build a complete weekly report with sections and a table from a week of raw notes.",
      },
    ],
    review: {
      prompt: "You need a long, multi-section document. What's the best first step?",
      options: [
        "Ask for the whole document in one go and hope for the best",
        "Ask for it in five separate chats",
        "Ask for an outline first, agree on it, then write it section by section",
      ],
      answer: 2,
    },
  },
  {
    id: "m5",
    title: "Trust but Verify",
    block: "Verify",
    teaches: "Ask for sources, check facts and numbers, and have Claude find the weak spots in its own answer.",
    runsIn: "console",
    techniques: ["9", "A"],
    outline: [
      {
        id: "m5.1",
        title: "Ask for Sources",
        goal: "Ask where each fact and number came from and mark anything Claude cannot back up.",
      },
      {
        id: "m5.2",
        title: "Spot the Invented",
        goal: "Compare an answer with your own material and catch the details that were made up.",
      },
      {
        id: "m5.3",
        title: "Critique Yourself",
        goal: "Ask Claude to name the three weakest points of its own answer, then fix them.",
      },
      {
        id: "m5.boss",
        title: "Verified Self-Assessment",
        goal: "Write a self-assessment for your review in which every claim is checked against your record.",
      },
    ],
    review: {
      prompt: "Claude's answer includes a confident statistic you plan to quote. What should you do first?",
      options: [
        "Quote it: Claude sounded sure",
        "Ask where the number comes from and check the source yourself",
        "Round it to make it look less precise",
      ],
      answer: 1,
    },
  },
  {
    id: "m6",
    title: "Your Material",
    block: "Verify",
    teaches: "Give Claude your own data: long documents, tables and several sources at once.",
    runsIn: "console",
    techniques: ["3"],
    outline: [
      {
        id: "m6.1",
        title: "Paste It Whole",
        goal: "Paste a long document in one piece instead of retelling it or sending it in parts.",
      },
      {
        id: "m6.2",
        title: "Tables In, Answers Out",
        goal: "Paste a table of data and ask questions that only the data can answer.",
      },
      {
        id: "m6.3",
        title: "Several Sources",
        goal: "Combine notes, an email thread and a task list into one clear picture.",
      },
      {
        id: "m6.boss",
        title: "Meeting Summary and Tasks",
        goal: "Turn a full set of meeting notes into a summary and a task list with owners and dates.",
      },
    ],
    review: {
      prompt: "You have a long report to discuss with Claude. What works best?",
      options: [
        "Paste it whole in one message",
        "Describe it from memory",
        "Paste it in small pieces over several messages",
      ],
      answer: 0,
    },
  },
  {
    id: "m7",
    title: "Projects",
    block: "Scale",
    teaches: "Projects in Claude: standing instructions and knowledge that every chat in the project uses.",
    runsIn: "claude",
    techniques: ["B"],
    outline: [
      {
        id: "m7.1",
        title: "Create a Project",
        goal: "Create a project called {projectTitle} on claude.ai and see what it adds to a plain chat.",
      },
      {
        id: "m7.2",
        title: "Standing Instructions",
        goal: "Write project instructions with your role, tone and formats so you never repeat them.",
      },
      {
        id: "m7.3",
        title: "Project Knowledge",
        goal: "Add your templates and best past documents to the project's knowledge.",
      },
      {
        id: "m7.boss",
        title: "Your Kit in Claude",
        goal: "Set up the {projectTitle} project and get a finished document from a new chat with zero setup.",
      },
    ],
    review: {
      prompt: "You type the same role, tone and format rules at the start of every chat. What fixes that?",
      options: [
        "Type them faster",
        "Put them in a Claude Project's instructions",
        "Keep one endless chat open forever",
      ],
      answer: 1,
    },
  },
  {
    id: "m8",
    title: "Artifacts",
    block: "Scale",
    teaches: "Artifacts in Claude: finished documents and mini-tools that live beside the chat and can be reused.",
    runsIn: "claude",
    techniques: ["C"],
    outline: [
      {
        id: "m8.1",
        title: "Meet Artifacts",
        goal: "Ask Claude for a document that opens as an artifact beside the chat.",
      },
      {
        id: "m8.2",
        title: "Edit in Place",
        goal: "Change one part of an artifact through the chat and compare the versions.",
      },
      {
        id: "m8.3",
        title: "A Mini Tool",
        goal: "Have Claude build a small interactive checklist or calculator as an artifact.",
      },
      {
        id: "m8.boss",
        title: "Reusable Template",
        goal: "Build a weekly report template as an artifact you can reuse every week.",
      },
    ],
    review: {
      prompt: "You need the same report layout every week. What's the best home for it?",
      options: [
        "A new chat each week, retyping the layout",
        "A screenshot of last week's report",
        "An artifact in Claude that you reuse and update",
      ],
      answer: 2,
    },
  },
];
