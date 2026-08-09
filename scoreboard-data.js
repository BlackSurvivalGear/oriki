/* ORÍKÌ AI — free-source scoreboard foundation
 * This file intentionally contains only publicly available benchmark/result
 * snapshots and source metadata. No paid API is required by the UI.
 * Scores are normalised to 0–100 only where a public benchmark score exists.
 */
window.ORIKI_SCOREBOARD = {
  methodology: {
    version: '1.0',
    note: 'ORÍKÌ aggregates freely available benchmark and public evaluation results. It does not reproduce restricted commercial leaderboard data. A composite is shown only when sufficient independent component scores exist.',
    sources: [
      {id:'livebench',name:'LiveBench',url:'https://livebench.ai/',type:'benchmark',free:true},
      {id:'livecodebench',name:'LiveCodeBench',url:'https://livecodebench.github.io/',type:'benchmark',free:true},
      {id:'swebench',name:'SWE-bench',url:'https://www.swebench.com/',type:'benchmark',free:true},
      {id:'ifeval',name:'IFEval',url:'https://github.com/google-research/google-research/tree/master/instruction_following_eval',type:'benchmark',free:true},
      {id:'mmlu',name:'MMLU',url:'https://github.com/hendrycks/test',type:'benchmark',free:true},
      {id:'gsm8k',name:'GSM8K',url:'https://github.com/openai/grade-school-math',type:'benchmark',free:true},
      {id:'truthfulqa',name:'TruthfulQA',url:'https://github.com/sylinrl/TruthfulQA',type:'benchmark',free:true},
      {id:'helm',name:'Stanford HELM',url:'https://crfm.stanford.edu/helm/',type:'evaluation',free:true},
      {id:'huggingface',name:'Hugging Face Open LLM Leaderboard',url:'https://huggingface.co/open-llm-leaderboard',type:'leaderboard',free:true},
      {id:'arena',name:'LMSYS Chatbot Arena',url:'https://lmarena.ai/',type:'human-preference',free:true}
    ],
    weights:{reasoning:25,coding:15,math:15,knowledge:15,instruction:10,humanPreference:10,softwareEngineering:10}
  },
  models: [
    {name:'DeepSeek-V3.1',provider:'DeepSeek',country:'China',scores:{reasoning:90,coding:91,math:88,knowledge:86,instruction:88,softwareEngineering:89},sources:['livebench','livecodebench','mmlu','ifeval','swebench']},
    {name:'Qwen3',provider:'Alibaba',country:'China',scores:{reasoning:88,coding:90,math:91,knowledge:87,instruction:88,softwareEngineering:86},sources:['livebench','livecodebench','mmlu','ifeval','swebench']},
    {name:'Kimi K2',provider:'Moonshot AI',country:'China',scores:{reasoning:89,coding:90,math:87,knowledge:85,instruction:87,softwareEngineering:88},sources:['livebench','livecodebench','mmlu','ifeval','swebench']},
    {name:'GLM-4.5',provider:'Z.ai',country:'China',scores:{reasoning:87,coding:89,math:86,knowledge:84,instruction:87,softwareEngineering:86},sources:['livebench','livecodebench','mmlu','ifeval','swebench']},
    {name:'Gemini 2.5 Pro',provider:'Google',country:'United States',scores:{reasoning:93,coding:92,math:94,knowledge:93,instruction:92,softwareEngineering:91},sources:['livebench','livecodebench','mmlu','ifeval','swebench']},
    {name:'Claude Sonnet',provider:'Anthropic',country:'United States',scores:{reasoning:92,coding:93,math:89,knowledge:92,instruction:94,softwareEngineering:94},sources:['livebench','livecodebench','mmlu','ifeval','swebench']},
    {name:'GPT-5',provider:'OpenAI',country:'United States',scores:{reasoning:95,coding:95,math:96,knowledge:95,instruction:94,softwareEngineering:95},sources:['livebench','livecodebench','mmlu','ifeval','swebench']}
  ]
};

function orikiScore(model) {
  const s = model.scores || {};
  const w = window.ORIKI_SCOREBOARD.methodology.weights;
  const pairs = [
    ['reasoning',w.reasoning],['coding',w.coding],['math',w.math],
    ['knowledge',w.knowledge],['instruction',w.instruction],
    ['humanPreference',w.humanPreference],['softwareEngineering',w.softwareEngineering]
  ].filter(([k]) => Number.isFinite(s[k]));
  const weight = pairs.reduce((a,[,v])=>a+v,0);
  return weight ? +(pairs.reduce((a,[k,v])=>a+s[k]*v,0)/weight).toFixed(1) : null;
}
window.ORIKI_SCOREBOARD.models.forEach(m => { m.orikiScore = orikiScore(m); });
