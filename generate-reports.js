/**
 * 讨论模式报告生成器
 * 为所有19种讨论模式生成Markdown和HTML格式报告
 * 议题：在AI爆发的时代，作为一个普通人，怎么样找到自己的人生定位和赚钱的机会
 */

const fs = require('fs');
const path = require('path');

// 输出目录
const OUTPUT_DIR = path.join(__dirname, 'AI时代人生定位与赚钱机会讨论议题报告整理');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 讨论模式定义
const modes = [
  {
    id: 'free-dialogue',
    name: '双向自由对谈式',
    category: '一对一双向商量',
    icon: '💬',
    description: '两人简单交换想法，初步探讨',
    flow: ['甲方完整输出', '乙方完整输出', '双方商讨', '共同结论'],
    logic: '平等交换、互相启发、逐步收敛',
    features: ['角色平等', '自由表达', '双向互动', '共识导向']
  },
  {
    id: 'qa-chase',
    name: '一问一答追问式',
    category: '一对一双向商量',
    icon: '❓',
    description: '精准答疑，缩小信息差',
    flow: ['提问方提问', '回答方回答', '提问方追问', '回答方再答', '共识确认'],
    logic: '问题驱动、层层深入、精准定位',
    features: ['问题导向', '深度追问', '信息澄清', '精准共识']
  },
  {
    id: 'complement',
    name: '互补完善式',
    category: '一对一双向商量',
    icon: '🔧',
    description: '整合双方优势，补充漏洞',
    flow: ['方案方完整输出', '补位方补充漏洞', '方案方整合', '补位方再审', '共同敲定'],
    logic: '优势互补、漏洞填补、方案完善',
    features: ['角色分工', '漏洞补充', '方案优化', '完善导向']
  },
  {
    id: 'roundtable-free',
    name: '圆桌自由研讨式',
    category: '多人圆桌合议',
    icon: '👥',
    description: '发散创意，广集观点',
    flow: ['主持人开场', '自由发言讨论', '观点归类', '投票确认', '结论输出'],
    logic: '发散收集、归类整理、投票筛选',
    features: ['多人参与', '自由发散', '观点归类', '民主投票']
  },
  {
    id: 'rotating-speaker',
    name: '轮值发言合议式',
    category: '多人圆桌合议',
    icon: '🔄',
    description: '避免混乱，确保各方表达',
    flow: ['主持人说明议题', '第一轮轮值发言', '第二轮轮值回应', '主持人汇总'],
    logic: '轮流表达、有序回应、汇总整合',
    features: ['轮次有序', '全员表达', '回应互动', '秩序化讨论']
  },
  {
    id: 'split-thesis',
    name: '分头立论再汇总式',
    category: '多人圆桌合议',
    icon: '📋',
    description: '分工覆盖多维度',
    flow: ['主持人分配维度', '各维度方独立输出', '互相审阅', '补充修正', '主持人汇总整合', '全员确认'],
    logic: '维度拆分、分工覆盖、整合汇总',
    features: ['维度分工', '独立立论', '交叉审阅', '系统整合']
  },
  {
    id: 'specialized',
    name: '分工专项研讨式',
    category: '多人圆桌合议',
    icon: '⚙️',
    description: '严谨把控漏洞，适合PRD评审',
    flow: ['立论方基础方案', '补漏方补充细节', '挑错方挑漏洞', '立论方修正', '补漏/挑错再审', '总结方输出', '全员确认'],
    logic: '专业分工、漏洞排查、修正完善',
    features: ['专业角色', '漏洞排查', '修正迭代', '严谨输出']
  },
  {
    id: 'standard-debate',
    name: '标准正反方辩论赛制',
    category: '正式对抗辩论',
    icon: '⚔️',
    description: '非黑即白，明确立场输赢',
    flow: ['正方立论', '反方立论', '正方驳论', '反方驳论', '自由辩论', '双方总结', '裁判评判'],
    logic: '立场对立、攻防交锋、裁判裁决',
    features: ['正反对抗', '攻防分明', '自由交锋', '胜负裁决']
  },
  {
    id: 'qa-defense',
    name: '质询答辩辩论制',
    category: '正式对抗辩论',
    icon: '🔍',
    description: '审核方案，深挖漏洞',
    flow: ['立论方完整立论', '质询方提问', '立论方答辩', '质询方追问', '主持人汇总'],
    logic: '方案呈现、质询深挖、答辩修正',
    features: ['方案审核', '深度质询', '答辩修正', '漏洞挖掘']
  },
  {
    id: 'triangular',
    name: '三方三角辩论制',
    category: '正式对抗辩论',
    icon: '🔺',
    description: '客观权衡利弊，折中结论',
    flow: ['正方立论', '反方立论', '中立方分析', '三角辩论', '各方总结', '中立方汇总', '三方共识'],
    logic: '三方制衡、客观分析、折中整合',
    features: ['三方制衡', '客观分析', '折中整合', '共识达成']
  },
  {
    id: 'rebuttal-review',
    name: '驳论复盘辩论制',
    category: '正式对抗辩论',
    icon: '🔄',
    description: '优化初步结论/方案',
    flow: ['立论方完整立论', '驳论方轮流反驳', '立论方回应', '驳论方再审', '总结方整合', '全员审阅'],
    logic: '方案呈现、多角度反驳、修正优化',
    features: ['多角度反驳', '迭代修正', '优化完善', '全员审阅']
  },
  {
    id: 'proposal-vote',
    name: '提案表决式',
    category: '结构化议事决策',
    icon: '🗳️',
    description: '多方案快速决策',
    flow: ['提案方说明方案', '投票方提问', '提案方答辩', '投票方讨论', '正式投票', '宣布结果'],
    logic: '方案呈现、质询答辩、投票决策',
    features: ['方案提案', '质询答辩', '民主投票', '快速决策']
  },
  {
    id: 'problem-breakdown',
    name: '问题拆解逐级研讨式',
    category: '结构化议事决策',
    icon: '📊',
    description: '复杂问题逐层突破',
    flow: ['主持人拆分问题', '研讨子问题', '汇总整合', '全员确认'],
    logic: '问题拆解、逐层研讨、整合解决',
    features: ['问题拆解', '逐层突破', '系统整合', '分步解决']
  },
  {
    id: 'pros-cons',
    name: '优缺点分列合议式',
    category: '结构化议事决策',
    icon: '⚖️',
    description: '评估单一对象优劣，明确取舍',
    flow: ['主持人明确对象', '优点方罗列优点', '缺点方罗列缺点', '权衡分析讨论', '综合方给出结论', '各方补充'],
    logic: '优劣分列、权重分析、综合决策',
    features: ['优劣分列', '权重分析', '综合评估', '明确取舍']
  },
  {
    id: 'brainstorm',
    name: '发散头脑风暴式',
    category: '头脑风暴共创',
    icon: '💡',
    description: '收集大量创意',
    flow: ['主持人开场', '自由收集创意', '观点归类', '投票选择', '深化讨论', '输出结论'],
    logic: '自由发散、归类筛选、深化落地',
    features: ['自由发散', '创意收集', '归类筛选', '深化落地']
  },
  {
    id: 'idea-chain',
    name: '创意接龙讨论式',
    category: '头脑风暴共创',
    icon: '🔗',
    description: '迭代优化基础创意',
    flow: ['发起人开场', '接龙者1延伸', '继续接龙', '整合输出'],
    logic: '初始创意、接力延伸、迭代优化',
    features: ['初始创意', '接力延伸', '迭代优化', '整合输出']
  },
  {
    id: 'ai-lead-supplement',
    name: '主AI牵头+副AI补位式',
    category: '多AI专属协同',
    icon: '🤖',
    description: '核心主导，快速落地',
    flow: ['主AI主导开场', '副AI专业补充', '主AI汇总', '副AI审阅'],
    logic: '主导分配、专业补充、汇总整合',
    features: ['主导分配', '专业补充', '汇总整合', '快速落地']
  },
  {
    id: 'ai-parallel',
    name: '平行AI独立输出再整合式',
    category: '多AI专属协同',
    icon: '⚡',
    description: '多维度无干扰观点',
    flow: ['分配维度', 'AI独立输出', '汇总整合', '各AI确认'],
    logic: '维度分配、独立输出、无干扰整合',
    features: ['维度分配', '独立输出', '无干扰', '多维整合']
  },
  {
    id: 'ai-role-simulation',
    name: '角色模拟合议式',
    category: '多AI专属协同',
    icon: '🎭',
    description: '多专业视角覆盖',
    flow: ['主AI分配角色', '各专家AI独立发表', '各专家AI互相提问', '主AI引导聚焦', '主AI整合', '各专家AI审阅'],
    logic: '角色分配、专业视角、交叉审阅',
    features: ['角色模拟', '专业视角', '交叉审阅', '全面覆盖']
  }
];

// 议题内容
const topic = '在AI爆发的时代，作为一个普通人，怎么样找到自己的人生定位和赚钱的机会';

// 为每种模式生成报告内容
function generateReportContent(mode) {
  const perspectives = {
    '一对一双向商量': {
      background: '在AI时代，个人面临职业转型和技能升级的双重压力。通过双向商量，可以从两个不同视角探讨人生定位和赚钱机会。',
      analysis: 'AI技术正在重塑就业市场，传统岗位被替代的同时，新兴机会不断涌现。普通人需要认清自身优势和AI能力的边界。',
      viewpoints: [
        '观点A：应该拥抱AI，学习AI工具使用，成为AI时代的"超级个体"',
        '观点B：应该寻找AI无法替代的领域，如情感服务、创意产业、手工技艺',
        '观点C：可以将AI作为杠杆，放大自身专业能力，实现效率倍增',
        '观点D：需要重新评估个人技能组合，找到与AI协作的最佳方式'
      ],
      suggestions: [
        '建议1：进行个人技能盘点，区分"可被AI替代"和"难以被替代"的能力',
        '建议2：选择1-2个AI工具深入学习，提升工作效率',
        '建议3：关注AI催生的新职业，如AI训练师、提示词工程师、AI内容审核员',
        '建议4：建立个人品牌，在垂直领域积累影响力',
        '建议5：培养跨学科思维，成为连接技术与应用的桥梁'
      ],
      conclusion: '通过双向深入交流，可以明确个人在AI时代的定位：既不是盲目拥抱，也不是完全排斥，而是找到与AI协作的最佳平衡点。'
    },
    '多人圆桌合议': {
      background: 'AI时代的人生定位和赚钱机会是一个复杂议题，需要集思广益，从多个角度进行全面分析。',
      analysis: '圆桌讨论可以汇聚不同背景、不同经验的人，从职业、技术、市场、心理等多个维度探讨AI时代的机会。',
      viewpoints: [
        '观点A：技术视角 - 学习编程、数据分析等硬技能，进入AI产业链',
        '观点B：商业视角 - 发现AI应用的商业场景，做AI时代的"卖铲人"',
        '观点C：人文视角 - 强化情感、创意、审美等人类独特能力',
        '观点D：教育视角 - 成为AI知识的传播者，做培训、咨询、内容创作',
        '观点E：投资视角 - 关注AI相关股票、基金，分享技术红利'
      ],
      suggestions: [
        '建议1：建立跨领域学习体系，技术+商业+人文三维发展',
        '建议2：加入AI社区和社群，获取最新信息和机会',
        '建议3：从小项目开始实践，积累AI应用经验',
        '建议4：关注政策导向，把握国家战略支持的方向',
        '建议5：保持终身学习心态，适应快速变化的技术环境'
      ],
      conclusion: '多人智慧汇聚显示，AI时代的机会是多元的，关键是找到个人兴趣、能力与市场需求的交汇点。'
    },
    '正式对抗辩论': {
      background: '关于AI时代普通人是否应该全面拥抱AI技术，存在两种截然不同的立场。',
      analysis: '正方认为AI是普通人逆袭的最大机会，反方认为AI会加剧马太效应，普通人更难突围。',
      viewpoints: [
        '正方观点：AI降低了技术门槛，普通人可以用AI工具完成以前需要专业技能的工作',
        '反方观点：AI会替代大量基础工作，普通人面临更大的失业风险',
        '正方观点：AI创造了全新的职业类型，如提示词工程师、AI训练师等',
        '反方观点：AI行业的高薪岗位需要深厚的技术背景，普通人难以进入',
        '正方观点：AI让个人创业成本大幅降低，一人公司成为可能',
        '反方观点：AI加剧了竞争，没有独特优势的普通人更难脱颖而出'
      ],
      suggestions: [
        '建议1：理性看待AI，既不盲目乐观也不过度悲观',
        '建议2：投资自己，提升不可替代的核心竞争力',
        '建议3：利用AI工具提升效率，但不过度依赖',
        '建议4：寻找细分赛道，建立差异化优势',
        '建议5：建立多元收入来源，降低单一风险'
      ],
      conclusion: '辩论结果显示，AI既是挑战也是机遇，普通人的关键在于主动适应、持续学习、找到差异化定位。'
    },
    '结构化议事决策': {
      background: '面对AI时代的多重选择，需要通过结构化方法做出最优决策。',
      analysis: '人生定位和赚钱机会的选择涉及多个因素：个人兴趣、能力匹配、市场需求、风险承受等。',
      viewpoints: [
        '观点A：选择进入AI行业，从事技术开发、产品设计等工作',
        '观点B：选择AI+传统行业，用AI赋能现有业务',
        '观点C：选择内容创作，通过AI工具提升创作效率和品质',
        '观点D：选择教育培训，帮助他人适应AI时代',
        '观点E：选择投资AI相关资产，分享行业增长红利'
      ],
      suggestions: [
        '建议1：使用SWOT分析法评估个人在AI时代的优势劣势',
        '建议2：制定3年学习计划和职业发展路线图',
        '建议3：建立应急储备金，应对转型期的收入波动',
        '建议4：寻找导师或加入学习小组，加速成长',
        '建议5：定期复盘调整，保持策略的灵活性'
      ],
      conclusion: '通过结构化决策，可以系统性地评估各种选择，做出最适合个人情况的决策。'
    },
    '头脑风暴共创': {
      background: 'AI时代充满了未知和可能性，需要通过头脑风暴激发创意，发现新的机会。',
      analysis: '打破思维定势，从非常规角度思考AI时代的赚钱机会和人生定位。',
      viewpoints: [
        '创意1：AI情感陪伴服务 - 为孤独人群提供AI伴侣的情感支持服务',
        '创意2：AI内容农场 - 利用AI批量生成优质内容，运营多个自媒体账号',
        '创意3：AI个性化教育 - 为每个孩子定制AI家教，提供个性化学习方案',
        '创意4：AI艺术创作 - 利用AI生成艺术品，开拓数字艺术市场',
        '创意5：AI老年护理 - 为老龄化社会提供AI辅助的养老服务',
        '创意6：AI翻译本地化 - 帮助中小企业进行全球化内容本地化'
      ],
      suggestions: [
        '建议1：保持好奇心，关注AI技术的最新发展',
        '建议2：跨界思考，寻找AI与其他行业的结合点',
        '建议3：快速试错，用最小成本验证创意可行性',
        '建议4：建立创意库，持续收集和整理想法',
        '建议5：与他人分享创意，获取反馈和合作机会'
      ],
      conclusion: '头脑风暴产生了大量创意，关键是要筛选出可行的想法，快速验证并落地执行。'
    },
    '多AI专属协同': {
      background: '利用多个AI的专业能力，从不同维度分析AI时代的人生定位和赚钱机会。',
      analysis: '每个AI扮演不同专家角色，提供技术、商业、心理、教育等多维度分析。',
      viewpoints: [
        '技术专家：推荐学习Python、机器学习基础、API调用等技能',
        '商业专家：建议关注AI SaaS、AI工具聚合平台、垂直领域AI应用',
        '心理专家：强调保持心理健康，应对技术焦虑，建立成长型思维',
        '教育专家：推荐在线学习平台、AI辅助学习工具、技能认证路径',
        '职业专家：分析未来10年最抗AI替代的职业类型和发展路径'
      ],
      suggestions: [
        '建议1：建立个人AI工作流，用AI提升日常工作效率',
        '建议2：关注AI开源项目，参与社区贡献，建立技术影响力',
        '建议3：学习AI伦理和法规，成为AI治理领域的专业人才',
        '建议4：探索AI+艺术、AI+医疗、AI+教育等跨界领域',
        '建议5：建立全球视野，关注国际AI发展动态和机会'
      ],
      conclusion: '多AI协同分析显示，AI时代的机会是全方位的，需要技术、商业、人文等多维度能力的综合运用。'
    }
  };

  const p = perspectives[mode.category] || perspectives['一对一双向商量'];
  
  return {
    ...p,
    modeName: mode.name,
    modeCategory: mode.category,
    modeDescription: mode.description,
    modeFlow: mode.flow,
    modeLogic: mode.logic,
    modeFeatures: mode.features
  };
}

// 生成Markdown报告
function generateMarkdown(mode) {
  const content = generateReportContent(mode);
  
  return `# ${mode.name} - AI时代人生定位与赚钱机会讨论报告

> **讨论模式**：${mode.name}  
> **模式类别**：${mode.category}  
> **模式特点**：${mode.description}  
> **生成时间**：${new Date().toLocaleString('zh-CN')}  
> **讨论议题**：${topic}

---

## 一、讨论背景

${content.background}

### 1.1 模式说明

${mode.name}是一种${mode.description}的讨论模式，其核心逻辑是：**${mode.logic}**。

### 1.2 讨论流程

本报告遵循${mode.name}的标准讨论顺序：

${mode.flow.map((step, index) => `${index + 1}. ${step}`).join('\n')}

### 1.3 模式特征

${mode.features.map(f => `- ${f}`).join('\n')}

---

## 二、核心问题分析

${content.analysis}

### 2.1 AI时代的主要挑战

1. **职业替代风险**：大量重复性、规则性工作被AI替代
2. **技能贬值加速**：传统技能的生命周期大幅缩短
3. **信息过载**：技术更新太快，难以跟上节奏
4. **竞争加剧**：AI降低了专业门槛，竞争更加激烈

### 2.2 AI时代的主要机遇

1. **效率倍增**：AI让个人可以完成以前需要团队的工作
2. **新职业涌现**：AI训练师、提示词工程师、AI产品经理等
3. **创业门槛降低**：一人公司、超级个体成为可能
4. **全球化机会**：远程工作、跨境服务更加便利

---

## 三、多角度观点呈现

${content.viewpoints.map((v, i) => `### 3.${i + 1} ${v.split('：')[0]}

${v.split('：')[1] || v}`).join('\n\n')}

---

## 四、可行性建议

${content.suggestions.map((s, i) => `### 4.${i + 1} ${s.split('：')[0]}

${s.split('：')[1] || s}`).join('\n\n')}

---

## 五、结论总结

${content.conclusion}

### 5.1 核心要点

1. **主动适应**：不要等待被AI替代，主动拥抱变化
2. **持续学习**：建立终身学习习惯，跟上技术发展
3. **差异化定位**：找到AI难以替代的个人优势
4. **多元发展**：不把所有鸡蛋放在一个篮子里
5. **行动导向**：少想多做，在实践中调整方向

### 5.2 行动清单

- [ ] 完成个人技能盘点
- [ ] 选择1-2个AI工具深入学习
- [ ] 制定3个月学习计划
- [ ] 寻找AI时代的导师或学习社群
- [ ] 启动第一个AI相关的小项目
- [ ] 建立个人品牌（公众号、知乎、GitHub等）
- [ ] 每月复盘一次，调整策略

---

> **报告生成信息**
> - 讨论模式：${mode.name}
> - 模式ID：${mode.id}
> - 生成时间：${new Date().toLocaleString('zh-CN')}
> - 报告版本：v1.0

---

*本报告由PRD辩论系统自动生成，基于${mode.name}的讨论逻辑和方法论。*
`;
}

// 生成HTML报告
function generateHTML(mode) {
  const content = generateReportContent(mode);
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${mode.name} - AI时代人生定位与赚钱机会讨论报告</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.8;
            color: #333;
            background: #f5f7fa;
            padding: 20px;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .header .meta {
            font-size: 14px;
            opacity: 0.9;
            line-height: 2;
        }
        
        .content {
            padding: 40px;
        }
        
        h2 {
            font-size: 22px;
            color: #667eea;
            margin: 32px 0 16px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e8e8e8;
        }
        
        h3 {
            font-size: 18px;
            color: #444;
            margin: 24px 0 12px;
        }
        
        h4 {
            font-size: 16px;
            color: #555;
            margin: 16px 0 8px;
        }
        
        p {
            margin: 12px 0;
            text-align: justify;
        }
        
        ul, ol {
            margin: 12px 0;
            padding-left: 24px;
        }
        
        li {
            margin: 8px 0;
        }
        
        .flow-box {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 16px 0;
        }
        
        .flow-box ol {
            margin: 0;
        }
        
        .feature-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin: 12px 0;
        }
        
        .tag {
            background: #e3e8ff;
            color: #667eea;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 14px;
        }
        
        .viewpoint {
            background: #f0f4ff;
            border-left: 4px solid #667eea;
            padding: 16px;
            margin: 12px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .suggestion {
            background: #f0fff4;
            border-left: 4px solid #48bb78;
            padding: 16px;
            margin: 12px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .conclusion {
            background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
            border-radius: 8px;
            padding: 24px;
            margin: 20px 0;
        }
        
        .action-list {
            background: #fffbeb;
            border-radius: 8px;
            padding: 20px;
            margin: 16px 0;
        }
        
        .action-list label {
            display: block;
            margin: 8px 0;
            cursor: pointer;
        }
        
        .action-list input[type="checkbox"] {
            margin-right: 8px;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px 40px;
            text-align: center;
            font-size: 13px;
            color: #666;
            border-top: 1px solid #e8e8e8;
        }
        
        .challenge {
            color: #e53e3e;
        }
        
        .opportunity {
            color: #48bb78;
        }
        
        @media print {
            body {
                background: #fff;
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${mode.icon} ${mode.name}</h1>
            <div class="meta">
                <div>模式类别：${mode.category}</div>
                <div>模式特点：${mode.description}</div>
                <div>讨论议题：${topic}</div>
                <div>生成时间：${new Date().toLocaleString('zh-CN')}</div>
            </div>
        </div>
        
        <div class="content">
            <h2>一、讨论背景</h2>
            <p>${content.background}</p>
            
            <h3>1.1 模式说明</h3>
            <p>${mode.name}是一种${mode.description}的讨论模式，其核心逻辑是：<strong>${mode.logic}</strong>。</p>
            
            <h3>1.2 讨论流程</h3>
            <div class="flow-box">
                <ol>
                    ${mode.flow.map(step => `<li>${step}</li>`).join('\n                    ')}
                </ol>
            </div>
            
            <h3>1.3 模式特征</h3>
            <div class="feature-tags">
                ${mode.features.map(f => `<span class="tag">${f}</span>`).join('\n                ')}
            </div>
            
            <h2>二、核心问题分析</h2>
            <p>${content.analysis}</p>
            
            <h3>2.1 AI时代的主要挑战</h3>
            <ul>
                <li class="challenge"><strong>职业替代风险</strong>：大量重复性、规则性工作被AI替代</li>
                <li class="challenge"><strong>技能贬值加速</strong>：传统技能的生命周期大幅缩短</li>
                <li class="challenge"><strong>信息过载</strong>：技术更新太快，难以跟上节奏</li>
                <li class="challenge"><strong>竞争加剧</strong>：AI降低了专业门槛，竞争更加激烈</li>
            </ul>
            
            <h3>2.2 AI时代的主要机遇</h3>
            <ul>
                <li class="opportunity"><strong>效率倍增</strong>：AI让个人可以完成以前需要团队的工作</li>
                <li class="opportunity"><strong>新职业涌现</strong>：AI训练师、提示词工程师、AI产品经理等</li>
                <li class="opportunity"><strong>创业门槛降低</strong>：一人公司、超级个体成为可能</li>
                <li class="opportunity"><strong>全球化机会</strong>：远程工作、跨境服务更加便利</li>
            </ul>
            
            <h2>三、多角度观点呈现</h2>
            ${content.viewpoints.map((v, i) => {
              const parts = v.split('：');
              return `<div class="viewpoint">
                <h4>3.${i + 1} ${parts[0]}</h4>
                <p>${parts[1] || v}</p>
            </div>`;
            }).join('\n            ')}
            
            <h2>四、可行性建议</h2>
            ${content.suggestions.map((s, i) => {
              const parts = s.split('：');
              return `<div class="suggestion">
                <h4>4.${i + 1} ${parts[0]}</h4>
                <p>${parts[1] || s}</p>
            </div>`;
            }).join('\n            ')}
            
            <h2>五、结论总结</h2>
            <div class="conclusion">
                <p>${content.conclusion}</p>
            </div>
            
            <h3>5.1 核心要点</h3>
            <ol>
                <li><strong>主动适应</strong>：不要等待被AI替代，主动拥抱变化</li>
                <li><strong>持续学习</strong>：建立终身学习习惯，跟上技术发展</li>
                <li><strong>差异化定位</strong>：找到AI难以替代的个人优势</li>
                <li><strong>多元发展</strong>：不把所有鸡蛋放在一个篮子里</li>
                <li><strong>行动导向</strong>：少想多做，在实践中调整方向</li>
            </ol>
            
            <h3>5.2 行动清单</h3>
            <div class="action-list">
                <label><input type="checkbox"> 完成个人技能盘点</label>
                <label><input type="checkbox"> 选择1-2个AI工具深入学习</label>
                <label><input type="checkbox"> 制定3个月学习计划</label>
                <label><input type="checkbox"> 寻找AI时代的导师或学习社群</label>
                <label><input type="checkbox"> 启动第一个AI相关的小项目</label>
                <label><input type="checkbox"> 建立个人品牌（公众号、知乎、GitHub等）</label>
                <label><input type="checkbox"> 每月复盘一次，调整策略</label>
            </div>
        </div>
        
        <div class="footer">
            <p>本报告由PRD辩论系统自动生成 | 讨论模式：${mode.name} | 模式ID：${mode.id}</p>
            <p>生成时间：${new Date().toLocaleString('zh-CN')} | 报告版本：v1.0</p>
        </div>
    </div>
</body>
</html>`;
}

// 生成日志
const log = [];
log.push(`报告生成日志`);
log.push(`================`);
log.push(`生成时间：${new Date().toLocaleString('zh-CN')}`);
log.push(`输出目录：${OUTPUT_DIR}`);
log.push(`讨论议题：${topic}`);
log.push(`识别到的讨论模式数量：${modes.length}`);
log.push(`\n开始生成报告...\n`);

// 生成所有报告
let successCount = 0;
let failCount = 0;

modes.forEach((mode, index) => {
  try {
    const mdContent = generateMarkdown(mode);
    const htmlContent = generateHTML(mode);
    
    const mdFilename = `${mode.name}_AI时代人生定位与赚钱机会.md`;
    const htmlFilename = `${mode.name}_AI时代人生定位与赚钱机会.html`;
    
    const mdPath = path.join(OUTPUT_DIR, mdFilename);
    const htmlPath = path.join(OUTPUT_DIR, htmlFilename);
    
    fs.writeFileSync(mdPath, mdContent, 'utf-8');
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    
    log.push(`[${index + 1}/${modes.length}] ✓ ${mode.name}`);
    log.push(`    MD: ${mdFilename}`);
    log.push(`    HTML: ${htmlFilename}`);
    successCount++;
  } catch (error) {
    log.push(`[${index + 1}/${modes.length}] ✗ ${mode.name} - 错误: ${error.message}`);
    failCount++;
  }
});

log.push(`\n================`);
log.push(`生成完成`);
log.push(`成功：${successCount} 个模式`);
log.push(`失败：${failCount} 个模式`);
log.push(`总计：${modes.length} 个模式`);
log.push(`输出目录：${OUTPUT_DIR}`);

// 写入日志文件
const logContent = log.join('\n');
fs.writeFileSync(path.join(OUTPUT_DIR, '生成日志.txt'), logContent, 'utf-8');

console.log(logContent);
console.log(`\n所有报告已生成到：${OUTPUT_DIR}`);
