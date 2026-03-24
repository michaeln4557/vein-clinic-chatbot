// ===== FUNNEL TAB =====
export const funnelKpis = [
  { label: 'Total Conversations', value: '2,847', change: '+12.3%', trend: 'up' as const },
  { label: 'Overall Conversion', value: '18.4%', change: '+1.8%', trend: 'up' as const },
  { label: 'Avg Messages to Convert', value: '11.2', change: '-0.8', trend: 'up' as const },
  { label: 'Top Drop-Off Stage', value: 'Insurance Inquiry', change: '', trend: 'flat' as const },
];

export const fullFunnelData = [
  { name: 'Conversation Started', value: 2847, fill: '#0d9488' },
  { name: 'User Responded', value: 2340, fill: '#0f766e' },
  { name: 'Meaningfully Engaged', value: 1892, fill: '#14b8a6' },
  { name: 'Intent Identified', value: 1654, fill: '#2dd4bf' },
  { name: 'Booking Flow Started', value: 892, fill: '#5eead4' },
  { name: 'Booking Completed', value: 524, fill: '#99f6e4' },
  { name: 'Callback Requested', value: 412, fill: '#a7f3d0' },
  { name: 'Human Handoff', value: 186, fill: '#bbf7d0' },
  { name: 'Abandoned', value: 329, fill: '#fecaca' },
];

export const dropOffData = [
  { step: 'Greeting', dropOff: 5.2, color: '#10b981' },
  { step: 'Symptom Capture', dropOff: 8.1, color: '#10b981' },
  { step: 'Insurance Inquiry', dropOff: 22.4, color: '#ef4444' },
  { step: 'Location Select', dropOff: 7.3, color: '#10b981' },
  { step: 'Scheduling', dropOff: 14.6, color: '#f59e0b' },
  { step: 'Confirmation', dropOff: 3.8, color: '#10b981' },
];

export const abTestResults = [
  {
    id: 'ab-1', name: 'Recovery SMS Tone', status: 'completed' as const,
    control: { name: 'Professional', conversations: 420, conversions: 84, rate: 20.0 },
    variant: { name: 'Warm & Personal', conversations: 418, conversions: 108, rate: 25.8 },
    lift: 29.0, confidence: 96.2, winner: 'variant' as const,
  },
  {
    id: 'ab-2', name: 'Insurance Reassurance Copy', status: 'running' as const,
    control: { name: 'Standard', conversations: 310, conversions: 62, rate: 20.0 },
    variant: { name: 'Empathetic Reframe', conversations: 308, conversions: 74, rate: 24.0 },
    lift: 20.0, confidence: 82.1, winner: null,
  },
  {
    id: 'ab-3', name: 'Booking CTA Placement', status: 'completed' as const,
    control: { name: 'End of Flow', conversations: 550, conversions: 132, rate: 24.0 },
    variant: { name: 'After Intent', conversations: 548, conversions: 159, rate: 29.0 },
    lift: 20.8, confidence: 94.5, winner: 'variant' as const,
  },
];

// ===== QUALITY TAB =====
export const ncsBreakdown = {
  overall: 78,
  components: [
    { name: 'Tone Appropriateness', score: 82, weight: 0.25 },
    { name: 'Response Relevance', score: 76, weight: 0.25 },
    { name: 'Information Accuracy', score: 80, weight: 0.20 },
    { name: 'Conversation Flow', score: 74, weight: 0.15 },
    { name: 'Empathy Expression', score: 77, weight: 0.15 },
  ],
};

export const tcsBreakdown = {
  overall: 71,
  components: [
    { name: 'Patient Engagement', score: 74, weight: 0.25 },
    { name: 'Question Depth', score: 68, weight: 0.20 },
    { name: 'Voluntary Info Sharing', score: 72, weight: 0.20 },
    { name: 'Return Interaction Rate', score: 73, weight: 0.20 },
    { name: 'Escalation Avoidance', score: 69, weight: 0.15 },
  ],
};

export const qualityTrendData = [
  { date: 'Mar 6', ncs: 74, tcs: 68 }, { date: 'Mar 7', ncs: 73, tcs: 67 },
  { date: 'Mar 8', ncs: 75, tcs: 69 }, { date: 'Mar 9', ncs: 76, tcs: 70 },
  { date: 'Mar 10', ncs: 74, tcs: 68 }, { date: 'Mar 11', ncs: 77, tcs: 71 },
  { date: 'Mar 12', ncs: 76, tcs: 70 }, { date: 'Mar 13', ncs: 78, tcs: 72 },
  { date: 'Mar 14', ncs: 77, tcs: 71 }, { date: 'Mar 15', ncs: 79, tcs: 73 },
  { date: 'Mar 16', ncs: 78, tcs: 72 }, { date: 'Mar 17', ncs: 77, tcs: 70 },
  { date: 'Mar 18', ncs: 79, tcs: 72 }, { date: 'Mar 19', ncs: 78, tcs: 71 },
];

export const qualityHeatmapData = [
  { playbook: 'New Patient Intake', hours: { 9: 82, 10: 85, 11: 80, 12: 74, 13: 78, 14: 81, 15: 83, 16: 79, 17: 76 } },
  { playbook: 'Insurance Collection', hours: { 9: 68, 10: 72, 11: 65, 12: 60, 13: 64, 14: 70, 15: 71, 16: 66, 17: 58 } },
  { playbook: 'Missed Call Recovery', hours: { 9: 78, 10: 80, 11: 76, 12: 72, 13: 75, 14: 79, 15: 81, 16: 77, 17: 74 } },
  { playbook: 'Booking Conversion', hours: { 9: 84, 10: 86, 11: 82, 12: 78, 13: 80, 14: 85, 15: 87, 16: 83, 17: 80 } },
  { playbook: 'Callback Request', hours: { 9: 75, 10: 78, 11: 73, 12: 70, 13: 72, 14: 76, 15: 78, 16: 74, 17: 71 } },
  { playbook: 'Patient Hesitation', hours: { 9: 70, 10: 73, 11: 68, 12: 64, 13: 67, 14: 72, 15: 74, 16: 69, 17: 65 } },
];

export const lowConfidenceSessions = [
  { id: 'CONV-2845', playbook: 'Insurance Collection', minConfidence: 0.32, fallbacksUsed: 3, outcome: 'abandoned' },
  { id: 'CONV-2831', playbook: 'New Patient Intake', minConfidence: 0.41, fallbacksUsed: 2, outcome: 'handoff' },
  { id: 'CONV-2818', playbook: 'FAQ', minConfidence: 0.38, fallbacksUsed: 4, outcome: 'abandoned' },
  { id: 'CONV-2804', playbook: 'Scheduling Unavailable', minConfidence: 0.45, fallbacksUsed: 2, outcome: 'callback' },
  { id: 'CONV-2798', playbook: 'Insurance Reassurance', minConfidence: 0.29, fallbacksUsed: 3, outcome: 'handoff' },
];

// ===== CALLBACKS TAB =====
export const callbackKpis = [
  { label: 'Callbacks Requested', value: '412', change: '+8.2%', trend: 'up' as const },
  { label: 'Callbacks Completed', value: '348', change: '+5.1%', trend: 'up' as const },
  { label: 'Avg Response Time', value: '14m', change: '-3m', trend: 'up' as const },
  { label: 'Callback-to-Booking', value: '62.4%', change: '+4.3%', trend: 'up' as const },
];

export const callbackQueueFull = [
  { id: 'CB-441', patient: 'A.R.', source: 'Insurance Escalation', priority: 'high' as const, requestedAt: '10:42 AM', assignedTo: 'Sarah M.', status: 'pending' as const, waitTime: '12m' },
  { id: 'CB-440', patient: 'M.K.', source: 'Booking Fallback', priority: 'medium' as const, requestedAt: '10:36 AM', assignedTo: 'Unassigned', status: 'pending' as const, waitTime: '18m' },
  { id: 'CB-439', patient: 'J.L.', source: 'Patient Request', priority: 'medium' as const, requestedAt: '10:29 AM', assignedTo: 'Mike T.', status: 'in_progress' as const, waitTime: '25m' },
  { id: 'CB-438', patient: 'S.P.', source: 'Follow-up', priority: 'low' as const, requestedAt: '10:12 AM', assignedTo: 'Unassigned', status: 'scheduled' as const, waitTime: '42m' },
  { id: 'CB-437', patient: 'D.W.', source: 'Complex Case', priority: 'high' as const, requestedAt: '10:05 AM', assignedTo: 'Sarah M.', status: 'in_progress' as const, waitTime: '49m' },
  { id: 'CB-436', patient: 'R.H.', source: 'After Hours', priority: 'medium' as const, requestedAt: '9:48 AM', assignedTo: 'Lisa K.', status: 'pending' as const, waitTime: '1h 6m' },
  { id: 'CB-435', patient: 'T.N.', source: 'Insurance Escalation', priority: 'high' as const, requestedAt: '9:30 AM', assignedTo: 'Mike T.', status: 'in_progress' as const, waitTime: '1h 24m' },
  { id: 'CB-434', patient: 'C.B.', source: 'Patient Request', priority: 'low' as const, requestedAt: '9:15 AM', assignedTo: 'Unassigned', status: 'scheduled' as const, waitTime: '1h 39m' },
];

export const handoffReasons = [
  { reason: 'Insurance Complexity', count: 68 },
  { reason: 'Patient Request', count: 45 },
  { reason: 'Low Confidence', count: 32 },
  { reason: 'Negative Sentiment', count: 24 },
  { reason: 'Clinical Question', count: 17 },
];

export const responseTimeDistribution = [
  { bucket: '< 5 min', count: 142 },
  { bucket: '5-15 min', count: 98 },
  { bucket: '15-30 min', count: 64 },
  { bucket: '30-60 min', count: 28 },
  { bucket: '> 60 min', count: 16 },
];

// ===== RECOVERY TAB =====
export const recoveryPipeline = [
  { stage: 'Missed Calls', value: 1840, rate: null },
  { stage: 'SMS Sent', value: 1520, rate: 82.6 },
  { stage: 'Patient Responded', value: 892, rate: 58.7 },
  { stage: 'Lead Created', value: 674, rate: 75.6 },
  { stage: 'Booking Confirmed', value: 338, rate: 50.1 },
];

export const recoveryTrendData = Array.from({ length: 30 }, (_, i) => ({
  date: `Mar ${i + 1}`,
  rate: 65 + Math.random() * 15 + (i * 0.3),
}));

export const recoveryByHour = [
  { hour: '8am', rate: 62.1 }, { hour: '9am', rate: 71.4 }, { hour: '10am', rate: 78.2 },
  { hour: '11am', rate: 75.8 }, { hour: '12pm', rate: 68.3 }, { hour: '1pm', rate: 72.1 },
  { hour: '2pm', rate: 76.5 }, { hour: '3pm', rate: 74.2 }, { hour: '4pm', rate: 70.8 },
  { hour: '5pm', rate: 65.4 }, { hour: '6pm', rate: 58.2 }, { hour: '7pm', rate: 52.1 },
];

export const recoveryByLocation = [
  { location: 'Midtown Manhattan', missedCalls: 245, smsSent: 210, responseRate: 62.4, bookingRate: 38.2, recoveryRate: 23.8 },
  { location: 'Downtown Brooklyn', missedCalls: 198, smsSent: 172, responseRate: 58.1, bookingRate: 35.5, recoveryRate: 20.6 },
  { location: 'Fort Worth', missedCalls: 156, smsSent: 138, responseRate: 64.5, bookingRate: 41.3, recoveryRate: 26.6 },
  { location: 'San Diego', missedCalls: 134, smsSent: 118, responseRate: 60.2, bookingRate: 36.8, recoveryRate: 22.1 },
  { location: 'Hoboken', missedCalls: 112, smsSent: 98, responseRate: 67.3, bookingRate: 42.1, recoveryRate: 28.3 },
];

export const smsTemplatePerformance = [
  { template: 'We Missed Your Call', timesSent: 580, responseRate: 62.4, bookingRate: 38.2 },
  { template: 'Quick Follow-Up', timesSent: 420, responseRate: 55.8, bookingRate: 32.1 },
  { template: 'Appointment Available', timesSent: 320, responseRate: 68.1, bookingRate: 44.7 },
  { template: 'Insurance Help', timesSent: 200, responseRate: 48.5, bookingRate: 28.3 },
];

// ===== CHANNELS TAB =====
export const channelComparison = [
  { channel: 'Web Chat', conversations: 1240, bookings: 186, convRate: 15.0, avgTimeToBook: '5m 12s', ncsScore: 81, costPerBooking: '$42' },
  { channel: 'SMS (Missed Call)', conversations: 892, bookings: 338, convRate: 37.9, avgTimeToBook: '3m 48s', ncsScore: 76, costPerBooking: '$18' },
  { channel: 'SMS (Inbound)', conversations: 415, bookings: 128, convRate: 30.8, avgTimeToBook: '4m 05s', ncsScore: 79, costPerBooking: '$24' },
  { channel: 'Phone Transfer', conversations: 200, bookings: 72, convRate: 36.0, avgTimeToBook: '6m 30s', ncsScore: 74, costPerBooking: '$65' },
  { channel: 'Referral Portal', conversations: 100, bookings: 34, convRate: 34.0, avgTimeToBook: '4m 22s', ncsScore: 82, costPerBooking: '$38' },
];

export const channelTrendData = Array.from({ length: 14 }, (_, i) => ({
  date: `Mar ${i + 6}`,
  webChat: 14 + Math.random() * 3,
  smsRecovery: 35 + Math.random() * 5,
  smsInbound: 28 + Math.random() * 4,
  phone: 33 + Math.random() * 5,
}));

export const campaignPerformance = [
  { campaign: 'Google Ads - Varicose Veins', source: 'Google', conversations: 420, bookings: 84, rate: 20.0, spend: '$3,200', costPerBooking: '$38.10', roi: '4.2x' },
  { campaign: 'Facebook - Spider Veins', source: 'Facebook', conversations: 310, bookings: 56, rate: 18.1, spend: '$2,800', costPerBooking: '$50.00', roi: '3.1x' },
  { campaign: 'Google Ads - Near Me', source: 'Google', conversations: 280, bookings: 72, rate: 25.7, spend: '$2,100', costPerBooking: '$29.17', roi: '5.8x' },
  { campaign: 'Organic Search', source: 'Organic', conversations: 520, bookings: 104, rate: 20.0, spend: '$0', costPerBooking: '$0', roi: 'N/A' },
  { campaign: 'Direct / Referral', source: 'Referral', conversations: 380, bookings: 118, rate: 31.1, spend: '$0', costPerBooking: '$0', roi: 'N/A' },
  { campaign: 'Bing Ads - Vein Treatment', source: 'Bing', conversations: 140, bookings: 32, rate: 22.9, spend: '$1,100', costPerBooking: '$34.38', roi: '4.6x' },
];

// ===== LOCATIONS TAB =====
export const locationComparison = [
  { location: 'Midtown Manhattan', conversations: 425, bookings: 98, convRate: 23.1, avgWait: '3m 15s', ncsScore: 84, recoveryRate: 76.2, crmSync: 99.8 },
  { location: 'Downtown Brooklyn', conversations: 380, bookings: 82, convRate: 21.6, avgWait: '3m 42s', ncsScore: 81, recoveryRate: 72.5, crmSync: 99.5 },
  { location: 'Fort Worth', conversations: 310, bookings: 78, convRate: 25.2, avgWait: '2m 58s', ncsScore: 79, recoveryRate: 74.8, crmSync: 99.1 },
  { location: 'Hoboken', conversations: 265, bookings: 68, convRate: 25.7, avgWait: '3m 08s', ncsScore: 82, recoveryRate: 78.1, crmSync: 99.6 },
  { location: 'San Diego', conversations: 248, bookings: 58, convRate: 23.4, avgWait: '3m 22s', ncsScore: 80, recoveryRate: 71.3, crmSync: 98.9 },
  { location: 'Palo Alto', conversations: 195, bookings: 52, convRate: 26.7, avgWait: '2m 45s', ncsScore: 85, recoveryRate: 79.4, crmSync: 99.9 },
  { location: 'Stamford', conversations: 178, bookings: 42, convRate: 23.6, avgWait: '3m 30s', ncsScore: 78, recoveryRate: 70.1, crmSync: 99.2 },
  { location: 'Bethesda', conversations: 162, bookings: 44, convRate: 27.2, avgWait: '2m 52s', ncsScore: 83, recoveryRate: 77.6, crmSync: 99.7 },
];

export const locationTrendData = Array.from({ length: 14 }, (_, i) => ({
  date: `Mar ${i + 6}`,
  midtown: 22 + Math.random() * 4,
  brooklyn: 20 + Math.random() * 4,
  fortWorth: 24 + Math.random() * 3,
  hoboken: 24 + Math.random() * 4,
}));

// ===== PLAYBOOKS TAB =====
export const playbookPerformance = [
  { id: 'pb-1', name: 'New Patient Intake', status: 'published' as const, conversations: 892, convRate: 22.4, ncsScore: 82, dropOff: 8.2, avgMessages: 12, lastModified: '2026-03-18' },
  { id: 'pb-2', name: 'Insurance Collection', status: 'published' as const, conversations: 674, convRate: 18.1, ncsScore: 58, dropOff: 28.4, avgMessages: 15, lastModified: '2026-03-17' },
  { id: 'pb-3', name: 'Booking Conversion', status: 'published' as const, conversations: 524, convRate: 42.8, ncsScore: 86, dropOff: 6.1, avgMessages: 8, lastModified: '2026-03-19' },
  { id: 'pb-4', name: 'Missed Call Recovery', status: 'published' as const, conversations: 412, convRate: 37.9, ncsScore: 78, dropOff: 12.3, avgMessages: 6, lastModified: '2026-03-20' },
  { id: 'pb-5', name: 'Callback Request', status: 'published' as const, conversations: 348, convRate: 68.2, ncsScore: 76, dropOff: 5.4, avgMessages: 5, lastModified: '2026-03-16' },
  { id: 'pb-6', name: 'Insurance Reassurance', status: 'published' as const, conversations: 286, convRate: 24.5, ncsScore: 64, dropOff: 18.7, avgMessages: 10, lastModified: '2026-03-15' },
  { id: 'pb-7', name: 'Location Routing', status: 'published' as const, conversations: 245, convRate: 52.3, ncsScore: 80, dropOff: 4.2, avgMessages: 4, lastModified: '2026-03-14' },
  { id: 'pb-8', name: 'FAQ', status: 'published' as const, conversations: 198, convRate: 15.2, ncsScore: 74, dropOff: 22.1, avgMessages: 7, lastModified: '2026-03-13' },
  { id: 'pb-9', name: 'Human Handoff', status: 'published' as const, conversations: 186, convRate: 45.1, ncsScore: 72, dropOff: 8.8, avgMessages: 9, lastModified: '2026-03-12' },
  { id: 'pb-10', name: 'Patient Hesitation', status: 'published' as const, conversations: 156, convRate: 28.8, ncsScore: 70, dropOff: 15.4, avgMessages: 11, lastModified: '2026-03-11' },
  { id: 'pb-11', name: 'Scheduling Unavailable', status: 'published' as const, conversations: 134, convRate: 12.7, ncsScore: 62, dropOff: 22.1, avgMessages: 8, lastModified: '2026-03-10' },
  { id: 'pb-12', name: 'Duplicate Patient', status: 'published' as const, conversations: 89, convRate: 56.2, ncsScore: 75, dropOff: 7.1, avgMessages: 6, lastModified: '2026-03-09' },
  { id: 'pb-13', name: 'Low Confidence Fallback', status: 'draft' as const, conversations: 67, convRate: 8.9, ncsScore: 65, dropOff: 19.8, avgMessages: 14, lastModified: '2026-03-08' },
];

export const radarComparisonData = [
  { metric: 'Conversion', 'Booking Conversion': 42.8, 'Callback Request': 68.2, 'New Patient Intake': 22.4 },
  { metric: 'Quality (NCS)', 'Booking Conversion': 86, 'Callback Request': 76, 'New Patient Intake': 82 },
  { metric: 'Speed', 'Booking Conversion': 90, 'Callback Request': 95, 'New Patient Intake': 70 },
  { metric: 'Engagement', 'Booking Conversion': 85, 'Callback Request': 80, 'New Patient Intake': 88 },
  { metric: 'Accuracy', 'Booking Conversion': 88, 'Callback Request': 82, 'New Patient Intake': 84 },
];

// ===== QA REVIEW TAB =====
export const qaKpis = [
  { label: 'Flagged Conversations', value: '24', change: '+3', trend: 'down' as const },
  { label: 'Low-Confidence Sessions', value: '18', change: '-2', trend: 'up' as const },
  { label: 'Operator Edit Rate', value: '6.8%', change: '-0.4%', trend: 'up' as const },
  { label: 'Avg Edits per Session', value: '1.2', change: '-0.1', trend: 'up' as const },
];

export const flaggedConversationsFull = [
  { id: 'CONV-2845', flagType: 'low_confidence' as const, playbook: 'Insurance Collection', flaggedBy: 'System', flaggedAt: '10:42 AM', severity: 'high' as const, status: 'open' as const },
  { id: 'CONV-2838', flagType: 'policy_violation' as const, playbook: 'Insurance Reassurance', flaggedBy: 'System', flaggedAt: '10:18 AM', severity: 'critical' as const, status: 'open' as const },
  { id: 'CONV-2831', flagType: 'operator_flag' as const, playbook: 'New Patient Intake', flaggedBy: 'Sarah M.', flaggedAt: '9:55 AM', severity: 'medium' as const, status: 'reviewing' as const },
  { id: 'CONV-2824', flagType: 'sentiment' as const, playbook: 'Scheduling Unavailable', flaggedBy: 'System', flaggedAt: '9:30 AM', severity: 'medium' as const, status: 'open' as const },
  { id: 'CONV-2818', flagType: 'low_confidence' as const, playbook: 'FAQ', flaggedBy: 'System', flaggedAt: '9:12 AM', severity: 'high' as const, status: 'resolved' as const },
  { id: 'CONV-2811', flagType: 'operator_flag' as const, playbook: 'Missed Call Recovery', flaggedBy: 'Mike T.', flaggedAt: '8:48 AM', severity: 'low' as const, status: 'resolved' as const },
  { id: 'CONV-2804', flagType: 'policy_violation' as const, playbook: 'Booking Conversion', flaggedBy: 'System', flaggedAt: '8:22 AM', severity: 'high' as const, status: 'reviewing' as const },
  { id: 'CONV-2798', flagType: 'sentiment' as const, playbook: 'Insurance Collection', flaggedBy: 'System', flaggedAt: '8:05 AM', severity: 'medium' as const, status: 'open' as const },
];

export const editRateTrend = Array.from({ length: 14 }, (_, i) => ({
  date: `Mar ${i + 6}`,
  editRate: 7.5 - (i * 0.05) + (Math.random() * 0.8 - 0.4),
}));

export const policyViolations = [
  { rule: 'Prohibited Insurance Language', count: 12 },
  { rule: 'Clinical Advice Boundary', count: 8 },
  { rule: 'PHI in Response', count: 5 },
  { rule: 'Unapproved Phrase Used', count: 4 },
  { rule: 'Scheduling Promise Violation', count: 3 },
];

// ===== CRM HEALTH TAB =====
export const crmSyncKpis = [
  { label: 'Total Leads', value: '2,847', change: '+142', trend: 'up' as const },
  { label: 'Successfully Synced', value: '2,824', change: '+140', trend: 'up' as const },
  { label: 'Pending Sync', value: '12', change: '-3', trend: 'up' as const },
  { label: 'Failed', value: '11', change: '+5', trend: 'down' as const },
];

export const fieldCompleteness = [
  { field: 'First Name', extractionRate: 98.2, verificationRate: 95.1, conflictRate: 1.2 },
  { field: 'Last Name', extractionRate: 97.8, verificationRate: 94.6, conflictRate: 1.4 },
  { field: 'Phone Number', extractionRate: 99.5, verificationRate: 98.2, conflictRate: 0.3 },
  { field: 'Email', extractionRate: 72.4, verificationRate: 68.1, conflictRate: 3.8 },
  { field: 'Insurance Provider', extractionRate: 64.8, verificationRate: 58.2, conflictRate: 8.4 },
  { field: 'Member ID', extractionRate: 48.2, verificationRate: 42.1, conflictRate: 12.1 },
  { field: 'Symptoms', extractionRate: 86.3, verificationRate: 78.5, conflictRate: 4.2 },
  { field: 'Preferred Location', extractionRate: 82.1, verificationRate: 79.8, conflictRate: 2.1 },
];

export const syncErrors = [
  { id: 'ERR-1', timestamp: '10:38 AM', record: 'Lead #2841', field: 'Insurance Provider', error: 'Provider not found in CRM lookup', status: 'retrying' as const },
  { id: 'ERR-2', timestamp: '10:22 AM', record: 'Lead #2836', field: 'Member ID', error: 'Invalid format: expected 10 digits', status: 'failed' as const },
  { id: 'ERR-3', timestamp: '9:55 AM', record: 'Lead #2829', field: 'Email', error: 'Duplicate email detected in CRM', status: 'resolved' as const },
  { id: 'ERR-4', timestamp: '9:30 AM', record: 'Lead #2822', field: 'Phone', error: 'CRM API timeout after 30s', status: 'retrying' as const },
  { id: 'ERR-5', timestamp: '9:12 AM', record: 'Lead #2818', field: 'Location', error: 'Location ID not mapped in CRM', status: 'failed' as const },
];

export const extractionTrend = Array.from({ length: 14 }, (_, i) => ({
  date: `Mar ${i + 6}`,
  accuracy: 88 + (i * 0.15) + (Math.random() * 2 - 1),
}));
