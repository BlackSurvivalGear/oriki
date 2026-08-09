/* ORÍKÌ AI — free-source scoreboard foundation
 * IMPORTANT: this dataset contains no invented benchmark values.
 * GitHub Actions populates verified public results into `models`.
 */
window.ORIKI_SCOREBOARD = {
  methodology: {
    version: '1.0',
    note: 'ORÍKÌ aggregates freely available public benchmark results. It does not reproduce restricted commercial leaderboard data. A composite score is shown only when sufficient independent public component scores exist.',
    sources: [
      {id:'livebench',name:'LiveBench',url:'https://github.com/LiveBench/LiveBench',type:'benchmark',free:true,license:'See upstream repository license'},
      {id:'livecodebench',name:'LiveCodeBench',url:'https://github.com/LiveCodeBench/LiveCodeBench',type:'benchmark',free:true,license:'MIT'},
      {id:'swebench',name:'SWE-bench',url:'https://github.com/SWE-bench/SWE-bench',type:'benchmark',free:true,license:'MIT'},
      {id:'ifeval',name:'IFEval',url:'https://github.com/google-research/google-research/tree/master/instruction_following_eval',type:'benchmark',free:true,license:'See upstream repository license'},
      {id:'mmlu',name:'MMLU',url:'https://github.com/hendrycks/test',type:'benchmark',free:true,license:'See upstream repository license'},
      {id:'gsm8k',name:'GSM8K',url:'https://github.com/openai/grade-school-math',type:'benchmark',free:true,license:'See upstream repository license'},
      {id:'truthfulqa',name:'TruthfulQA',url:'https://github.com/sylinrl/TruthfulQA',type:'benchmark',free:true,license:'See upstream repository license'},
      {id:'helm',name:'Stanford HELM',url:'https://crfm.stanford.edu/helm/',type:'evaluation',free:true,license:'See upstream terms'},
      {id:'huggingface',name:'Hugging Face Open LLM Leaderboard',url:'https://huggingface.co/open-llm-leaderboard',type:'leaderboard',free:true,license:'Varies by dataset'},
      {id:'arena',name:'LMSYS Chatbot Arena',url:'https://lmarena.ai/',type:'human-preference',free:true,license:'See upstream terms'}
    ],
    weights:{reasoning:25,coding:15,math:15,knowledge:15,instruction:10,humanPreference:10,softwareEngineering:10}
  },
  models: [],
  updatedAt: null
};

function orikiScore(model) {
  const s = model.scores || {};
  const w = window.ORIKI_SCOREBOARD.methodology.weights;
  const pairs = Object.entries(w).filter(([k]) => Number.isFinite(s[k]));
  const weight = pairs.reduce((a,[,v]) => a + v, 0);
  if (pairs.length < 3 || weight < 40) return null;
  return +(pairs.reduce((a,[k,v]) => a + s[k] * v, 0) / weight).toFixed(1);
}
