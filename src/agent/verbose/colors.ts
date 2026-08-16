export const c = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  italic:  "\x1b[3m",

  // Evaluator: cyan family
  evalLabel:  "\x1b[36m",
  evalBorder: "\x1b[36m",

  // Explorer (subagent): magenta family
  exprLabel:  "\x1b[35m",
  exprBorder: "\x1b[35m",
  exprBg:     "\x1b[45m",

  // Tool names
  toolName:   "\x1b[33m",

  // Thinking / LLM reflection
  think:      "\x1b[90m",

  // Skill banner
  skillBg:    "\x1b[44m",
  skillFg:    "\x1b[97m",

  // Result dim
  result:     "\x1b[90m",
};

export const EVAL_PREFIX = `${c.evalLabel}${c.bold}[evaluator]${c.reset}`;
export const EXPL_PREFIX = `  ${c.exprLabel}${c.bold}[explorer]${c.reset}`;

export const MAX_PARAM_CHARS = 120;
export const MAX_RESULT_CHARS = 400;
