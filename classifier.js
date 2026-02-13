const departments = require('./data/departments.json');

const keywordMap = {
  corruption: ['corruption','bribery','bribe','tender','procurement','fraud','nepotism','kickback','embezzlement','scam','rigging','misuse','ghost'],
  electricity: ['electricity','power','load shedding','transformer','voltage','meter','nea','blackout','outage','wire','pole','sparking','bijuli'],
  water: ['water','supply','pipe','tank','drinking','dhara','khanepani','sewage','drainage','tap','contaminated'],
  road: ['road','pothole','bridge','footpath','highway','crack','pavement','traffic','construction','sadak','bato'],
  law: ['police','crime','theft','robbery','assault','harassment','violence','murder','threat','kidnap','drug'],
  health: ['hospital','health','medicine','doctor','clinic','disease','ambulance','pharmacy','vaccine','sanitation'],
  environment: ['garbage','waste','pollution','noise','smoke','deforestation','dumping','plastic','fohor','foul smell'],
  education: ['school','education','teacher','college','university','exam','scholarship','student','admission']
};

const urgencyKeywords = ['death','dead','dying','collapse','fire','electrocution','flood','landslide','earthquake','emergency','danger','explosion','trapped','drowning','fatal','critical','severe','urgent'];

function classify(title, description) {
  const text = (title + ' ' + description).toLowerCase();

  // Score each category
  let bestCategory = 'other';
  let bestScore = 0;

  for (const [cat, keywords] of Object.entries(keywordMap)) {
    let score = 0;
    for (const kw of keywords) {
      if (text.includes(kw)) {
        score += kw.includes(' ') ? 3 : 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  // Confidence
  const maxPossible = keywordMap[bestCategory] ? keywordMap[bestCategory].length : 1;
  const confidence = bestScore > 0
    ? Math.min(98, Math.round((bestScore / (maxPossible * 0.3)) * 100))
    : 50;

  // Urgency
  const isUrgent = urgencyKeywords.some(kw => text.includes(kw));
  const priority = isUrgent ? 'HIGH' : (confidence > 85 ? 'MEDIUM' : 'NORMAL');

  // Get department info
  const dept = departments[bestCategory] || departments['other'];

  return {
    category: dept.category,
    categoryKey: bestCategory,
    governmentLevel: dept.level,
    department: dept.department,
    confidence: confidence,
    priority: priority,
    isUrgent: isUrgent,
    slaHours: isUrgent ? 12 : dept.sla_hours
  };
}

module.exports = { classify };