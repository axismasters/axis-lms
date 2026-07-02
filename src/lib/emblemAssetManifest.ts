// AXIS LMS v1.2 — Phase 3D v3-r14: emblemAssetManifest.ts
// 검수 통과한 AXIS 엠블럼 PNG 에셋(axis_lms_emblem_assets_v1.zip)의 manifest.json을
// 기준으로 한 매핑 레이어. growthData.ts의 기존 Emblem 카탈로그와는 의도적으로 분리했다
// (지시서 §3: "기존 성장 데이터와 강하게 섞지 말고, 추후 DB 연동 가능하게 분리한다").
//
// ⚠ 원칙:
//   - 이 파일은 PNG 원본을 직접 다루지 않는다(재디자인/변형 없음) — 단지 이미 배치된
//     src/assets/emblems/** PNG를 가리키는 매핑 데이터일 뿐이다.
//   - manifest.json 자체의 id(예: 'habit_perfect_attendance')와 growthData.ts의 기존
//     엠블럼 id(예: 'emb-001')는 서로 다른 체계다. 이름/조건 문구가 명확히 일치하는
//     경우에만 EMBLEM_ID_TO_ASSET_ID에 연결했다 — 애매한 경우는 절대 추측으로 연결하지
//     않고 비워뒀다(해당 기존 엠블럼은 계속 AxisEmblemBadge의 SVG 렌더링을 그대로 쓴다).
//   - math_units 카테고리(21종)는 현재 growthData.ts에 대응하는 카탈로그 항목이 아예
//     없다(단원별 엠블럼 자체가 아직 없음) — 그래서 어떤 기존 id에도 연결하지 않았다.
//     자산 매니페스트에는 포함해 향후 카탈로그 확장 시 바로 쓸 수 있게 해뒀다.
//   - 기존 카탈로그 id/데이터는 이 파일에서 절대 변경하지 않는다(growthData.ts 원본 그대로).
//   - import.meta.glob 대신 이 프로젝트가 이미 쓰던 정적 import 패턴(AxisMark.tsx 등의
//     '@/assets/brand/*.png' import와 동일한 방식)을 그대로 따랐다 — 이 프로젝트는
//     vite/client 타입 참조를 의도적으로 피하고 있어(universityAnalysisClient.ts 주석
//     참고), import.meta.glob의 타입 지원에 의존하지 않기 위함이다.

import type { StudentTier } from './growthData';

import imgTierAxisMaster from '@/assets/emblems/tier/tier_axis_master.png';
import imgTierFocus from '@/assets/emblems/tier/tier_focus.png';
import imgTierFoundation from '@/assets/emblems/tier/tier_foundation.png';
import imgTierMastery from '@/assets/emblems/tier/tier_mastery.png';
import imgTierSeed from '@/assets/emblems/tier/tier_seed.png';
import imgTierStrategy from '@/assets/emblems/tier/tier_strategy.png';
import imgCoreHabitAssignmentFinisher from '@/assets/emblems/core/habit_assignment_finisher.png';
import imgCoreHabitFlawlessRoutine from '@/assets/emblems/core/habit_flawless_routine.png';
import imgCoreHabitHighFocusSession from '@/assets/emblems/core/habit_high_focus_session.png';
import imgCoreHabitIronWill from '@/assets/emblems/core/habit_iron_will.png';
import imgCoreHabitPerfectAttendance from '@/assets/emblems/core/habit_perfect_attendance.png';
import imgCoreHabitProofOfDiligence from '@/assets/emblems/core/habit_proof_of_diligence.png';
import imgCoreHabitReflectionComplete from '@/assets/emblems/core/habit_reflection_complete.png';
import imgCoreHabitWeeklyConsistency from '@/assets/emblems/core/habit_weekly_consistency.png';
import imgCoreIfCalculationPrecision from '@/assets/emblems/core/if_calculation_precision.png';
import imgCoreIfConceptMastery from '@/assets/emblems/core/if_concept_mastery.png';
import imgCoreIfFlawlessReview from '@/assets/emblems/core/if_flawless_review.png';
import imgCoreIfRecovery from '@/assets/emblems/core/if_recovery.png';
import imgCoreIfTimeControl from '@/assets/emblems/core/if_time_control.png';
import imgCoreIfWrongAnswerConqueror from '@/assets/emblems/core/if_wrong_answer_conqueror.png';
import imgCoreRivalChaser from '@/assets/emblems/core/rival_chaser.png';
import imgCoreRivalFirstComparison from '@/assets/emblems/core/rival_first_comparison.png';
import imgCoreRivalGrowthHighlight from '@/assets/emblems/core/rival_growth_highlight.png';
import imgCoreRivalLeader from '@/assets/emblems/core/rival_leader.png';
import imgCoreRivalRevengeSuccess from '@/assets/emblems/core/rival_revenge_success.png';
import imgCoreRivalRisingStreak from '@/assets/emblems/core/rival_rising_streak.png';
import imgCoreRivalVictory from '@/assets/emblems/core/rival_victory.png';
import imgCoreScore90Club from '@/assets/emblems/core/score_90_club.png';
import imgCoreScoreComebackGrowth from '@/assets/emblems/core/score_comeback_growth.png';
import imgCoreScoreGrowthSeed from '@/assets/emblems/core/score_growth_seed.png';
import imgCoreScorePerfectScore from '@/assets/emblems/core/score_perfect_score.png';
import imgCoreScorePersonalBest from '@/assets/emblems/core/score_personal_best.png';
import imgCoreScoreSteadyImprovement from '@/assets/emblems/core/score_steady_improvement.png';
import imgCoreScoreTenPointLeap from '@/assets/emblems/core/score_ten_point_leap.png';
import imgCoreScoreTopTierEntry from '@/assets/emblems/core/score_top_tier_entry.png';
import imgCoreSpMilestone from '@/assets/emblems/core/sp_milestone.png';
import imgHiddenAxisMasterKey from '@/assets/emblems/hidden/hidden_axis_master_key.png';
import imgHiddenAxisOfMathematics from '@/assets/emblems/hidden/hidden_axis_of_mathematics.png';
import imgHiddenComebackProof from '@/assets/emblems/hidden/hidden_comeback_proof.png';
import imgHiddenConceptUnlock from '@/assets/emblems/hidden/hidden_concept_unlock.png';
import imgHiddenFlawlessRoutine from '@/assets/emblems/hidden/hidden_flawless_routine.png';
import imgHiddenGenius from '@/assets/emblems/hidden/hidden_genius.png';
import imgHiddenPerfectScoreDeity from '@/assets/emblems/hidden/hidden_perfect_score_deity.png';
import imgHiddenQuietElite from '@/assets/emblems/hidden/hidden_quiet_elite.png';
import imgHiddenRevengeSuccess from '@/assets/emblems/hidden/hidden_revenge_success.png';
import imgHiddenSeasonPioneer from '@/assets/emblems/hidden/hidden_season_pioneer.png';
import imgHiddenSecondHalfDominator from '@/assets/emblems/hidden/hidden_second_half_dominator.png';
import imgHiddenTeacherRecommendedGrowth from '@/assets/emblems/hidden/hidden_teacher_recommended_growth.png';
import imgMathAnalyticGeometryDesigner from '@/assets/emblems/math_units/math_analytic_geometry_designer.png';
import imgMathCombinatoricsDesigner from '@/assets/emblems/math_units/math_combinatorics_designer.png';
import imgMathConicExplorer from '@/assets/emblems/math_units/math_conic_explorer.png';
import imgMathDerivativeTracker from '@/assets/emblems/math_units/math_derivative_tracker.png';
import imgMathDifferentialCalculusMaster from '@/assets/emblems/math_units/math_differential_calculus_master.png';
import imgMathEquationInequalityBreakthrough from '@/assets/emblems/math_units/math_equation_inequality_breakthrough.png';
import imgMathExponentLogNavigator from '@/assets/emblems/math_units/math_exponent_log_navigator.png';
import imgMathFunctionInterpreter from '@/assets/emblems/math_units/math_function_interpreter.png';
import imgMathIntegralCalculusMaster from '@/assets/emblems/math_units/math_integral_calculus_master.png';
import imgMathIntegralDesigner from '@/assets/emblems/math_units/math_integral_designer.png';
import imgMathLimitObserver from '@/assets/emblems/math_units/math_limit_observer.png';
import imgMathPermutationCombinationStrategist from '@/assets/emblems/math_units/math_permutation_combination_strategist.png';
import imgMathPlaneVectorNavigator from '@/assets/emblems/math_units/math_plane_vector_navigator.png';
import imgMathPolynomialConquest from '@/assets/emblems/math_units/math_polynomial_conquest.png';
import imgMathProbabilityJudge from '@/assets/emblems/math_units/math_probability_judge.png';
import imgMathSequenceLimitConqueror from '@/assets/emblems/math_units/math_sequence_limit_conqueror.png';
import imgMathSequencePatternMaster from '@/assets/emblems/math_units/math_sequence_pattern_master.png';
import imgMathSetLogicJudge from '@/assets/emblems/math_units/math_set_logic_judge.png';
import imgMathSolidGeometryArchitect from '@/assets/emblems/math_units/math_solid_geometry_architect.png';
import imgMathStatisticsInterpreter from '@/assets/emblems/math_units/math_statistics_interpreter.png';
import imgMathTrigonometryHarmonizer from '@/assets/emblems/math_units/math_trigonometry_harmonizer.png';
export type EmblemAssetCategory = 'tier' | 'core' | 'hidden' | 'math_units';

export interface EmblemAssetEntry {
  /** manifest.json의 원본 id */
  assetId: string;
  /** manifest.json의 title(영문/국문 병기 그대로) — UI에는 이 값을 직접 굽지 않고,
   *  기존 카탈로그와 연결된 경우 기존 name/parentSafeLabel을 우선 쓴다. */
  displayName: string;
  category: EmblemAssetCategory;
  /** manifest.json의 condition 원문(참고용, 실제 지급 조건 판정 로직은 growthData.ts가 담당) */
  condition: string;
  /** manifest.json 기준 원본 상대 경로(추적용, 실제 렌더링에는 imageSrc를 쓴다) */
  sourcePath: string;
  /** 정적 import로 번들링된 실제 이미지 URL. */
  imageSrc: string;
}

// ─── assetId → 번들링된 이미지 URL ────────────────────────────────────────
const ASSET_ID_TO_IMAGE: Record<string, string> = {
  'tier_axis_master': imgTierAxisMaster,
  'tier_focus': imgTierFocus,
  'tier_foundation': imgTierFoundation,
  'tier_mastery': imgTierMastery,
  'tier_seed': imgTierSeed,
  'tier_strategy': imgTierStrategy,
  'habit_assignment_finisher': imgCoreHabitAssignmentFinisher,
  'habit_flawless_routine': imgCoreHabitFlawlessRoutine,
  'habit_high_focus_session': imgCoreHabitHighFocusSession,
  'habit_iron_will': imgCoreHabitIronWill,
  'habit_perfect_attendance': imgCoreHabitPerfectAttendance,
  'habit_proof_of_diligence': imgCoreHabitProofOfDiligence,
  'habit_reflection_complete': imgCoreHabitReflectionComplete,
  'habit_weekly_consistency': imgCoreHabitWeeklyConsistency,
  'if_calculation_precision': imgCoreIfCalculationPrecision,
  'if_concept_mastery': imgCoreIfConceptMastery,
  'if_flawless_review': imgCoreIfFlawlessReview,
  'if_recovery': imgCoreIfRecovery,
  'if_time_control': imgCoreIfTimeControl,
  'if_wrong_answer_conqueror': imgCoreIfWrongAnswerConqueror,
  'rival_chaser': imgCoreRivalChaser,
  'rival_first_comparison': imgCoreRivalFirstComparison,
  'rival_growth_highlight': imgCoreRivalGrowthHighlight,
  'rival_leader': imgCoreRivalLeader,
  'rival_revenge_success': imgCoreRivalRevengeSuccess,
  'rival_rising_streak': imgCoreRivalRisingStreak,
  'rival_victory': imgCoreRivalVictory,
  'score_90_club': imgCoreScore90Club,
  'score_comeback_growth': imgCoreScoreComebackGrowth,
  'score_growth_seed': imgCoreScoreGrowthSeed,
  'score_perfect_score': imgCoreScorePerfectScore,
  'score_personal_best': imgCoreScorePersonalBest,
  'score_steady_improvement': imgCoreScoreSteadyImprovement,
  'score_ten_point_leap': imgCoreScoreTenPointLeap,
  'score_top_tier_entry': imgCoreScoreTopTierEntry,
  'sp_milestone': imgCoreSpMilestone,
  'hidden_axis_master_key': imgHiddenAxisMasterKey,
  'hidden_axis_of_mathematics': imgHiddenAxisOfMathematics,
  'hidden_comeback_proof': imgHiddenComebackProof,
  'hidden_concept_unlock': imgHiddenConceptUnlock,
  'hidden_flawless_routine': imgHiddenFlawlessRoutine,
  'hidden_genius': imgHiddenGenius,
  'hidden_perfect_score_deity': imgHiddenPerfectScoreDeity,
  'hidden_quiet_elite': imgHiddenQuietElite,
  'hidden_revenge_success': imgHiddenRevengeSuccess,
  'hidden_season_pioneer': imgHiddenSeasonPioneer,
  'hidden_second_half_dominator': imgHiddenSecondHalfDominator,
  'hidden_teacher_recommended_growth': imgHiddenTeacherRecommendedGrowth,
  'math_analytic_geometry_designer': imgMathAnalyticGeometryDesigner,
  'math_combinatorics_designer': imgMathCombinatoricsDesigner,
  'math_conic_explorer': imgMathConicExplorer,
  'math_derivative_tracker': imgMathDerivativeTracker,
  'math_differential_calculus_master': imgMathDifferentialCalculusMaster,
  'math_equation_inequality_breakthrough': imgMathEquationInequalityBreakthrough,
  'math_exponent_log_navigator': imgMathExponentLogNavigator,
  'math_function_interpreter': imgMathFunctionInterpreter,
  'math_integral_calculus_master': imgMathIntegralCalculusMaster,
  'math_integral_designer': imgMathIntegralDesigner,
  'math_limit_observer': imgMathLimitObserver,
  'math_permutation_combination_strategist': imgMathPermutationCombinationStrategist,
  'math_plane_vector_navigator': imgMathPlaneVectorNavigator,
  'math_polynomial_conquest': imgMathPolynomialConquest,
  'math_probability_judge': imgMathProbabilityJudge,
  'math_sequence_limit_conqueror': imgMathSequenceLimitConqueror,
  'math_sequence_pattern_master': imgMathSequencePatternMaster,
  'math_set_logic_judge': imgMathSetLogicJudge,
  'math_solid_geometry_architect': imgMathSolidGeometryArchitect,
  'math_statistics_interpreter': imgMathStatisticsInterpreter,
  'math_trigonometry_harmonizer': imgMathTrigonometryHarmonizer,};

// ─── manifest.json 원본 69건 메타데이터(title/category/condition/sourcePath) ──
const EMBLEM_ASSET_META: { id: string; title: string; category: EmblemAssetCategory; condition: string; sourcePath: string }[] = [
  { id: 'tier_seed', title: 'Seed / 씨앗', category: 'tier', condition: 'SP 0 이상', sourcePath: 'emblems/tier/tier_seed.png' },
  { id: 'tier_foundation', title: 'Foundation / 기초', category: 'tier', condition: '누적 SP 300 이상', sourcePath: 'emblems/tier/tier_foundation.png' },
  { id: 'tier_focus', title: 'Focus / 집중', category: 'tier', condition: '누적 SP 800 이상', sourcePath: 'emblems/tier/tier_focus.png' },
  { id: 'tier_strategy', title: 'Strategy / 전략', category: 'tier', condition: '누적 SP 1,600 이상', sourcePath: 'emblems/tier/tier_strategy.png' },
  { id: 'tier_mastery', title: 'Mastery / 숙련', category: 'tier', condition: '누적 SP 2,800 이상', sourcePath: 'emblems/tier/tier_mastery.png' },
  { id: 'tier_axis_master', title: 'Axis Master / 축의 완성', category: 'tier', condition: '누적 SP 4,200 이상', sourcePath: 'emblems/tier/tier_axis_master.png' },

  { id: 'if_calculation_precision', title: '계산 정밀', category: 'core', condition: '계산 실수 손실 3회 연속 감소', sourcePath: 'emblems/core/if_calculation_precision.png' },
  { id: 'if_concept_mastery', title: '개념 완성', category: 'core', condition: '개념 부족 항목 3회 연속 개선', sourcePath: 'emblems/core/if_concept_mastery.png' },
  { id: 'if_time_control', title: '시간 컨트롤', category: 'core', condition: '시간 부족 손실 3회 연속 감소', sourcePath: 'emblems/core/if_time_control.png' },
  { id: 'if_wrong_answer_conqueror', title: '오답 정복자', category: 'core', condition: '오답 복습 10회 완료', sourcePath: 'emblems/core/if_wrong_answer_conqueror.png' },
  { id: 'if_recovery', title: 'IF 회복자', category: 'core', condition: '같은 약점 축 3회 연속 개선', sourcePath: 'emblems/core/if_recovery.png' },
  { id: 'if_flawless_review', title: '무결점 검토', category: 'core', condition: '계산/개념/시간 모두 양호', sourcePath: 'emblems/core/if_flawless_review.png' },
  { id: 'habit_perfect_attendance', title: '개근왕', category: 'core', condition: '월 출석률 100%', sourcePath: 'emblems/core/habit_perfect_attendance.png' },
  { id: 'habit_proof_of_diligence', title: '성실의 증거', category: 'core', condition: '3개월 연속 개근', sourcePath: 'emblems/core/habit_proof_of_diligence.png' },
  { id: 'habit_iron_will', title: '철의 의지', category: 'core', condition: '6개월 연속 개근', sourcePath: 'emblems/core/habit_iron_will.png' },
  { id: 'habit_assignment_finisher', title: '과제 완수자', category: 'core', condition: '과제 10회 연속 제출', sourcePath: 'emblems/core/habit_assignment_finisher.png' },
  { id: 'habit_weekly_consistency', title: '주간 꾸준함', category: 'core', condition: '주간 루틴 4주 유지', sourcePath: 'emblems/core/habit_weekly_consistency.png' },
  { id: 'habit_high_focus_session', title: '고집중 세션', category: 'core', condition: '고집중 학습 세션 달성', sourcePath: 'emblems/core/habit_high_focus_session.png' },
  { id: 'habit_reflection_complete', title: '복습 완료', category: 'core', condition: '테스트 회고/복습 완료', sourcePath: 'emblems/core/habit_reflection_complete.png' },
  { id: 'habit_flawless_routine', title: '무결점 루틴', category: 'core', condition: '출석·과제·복습 모두 충족', sourcePath: 'emblems/core/habit_flawless_routine.png' },
  { id: 'score_growth_seed', title: '성장의 씨앗', category: 'core', condition: '첫 시험 응시', sourcePath: 'emblems/core/score_growth_seed.png' },
  { id: 'score_ten_point_leap', title: '10점 도약', category: 'core', condition: '직전 동일 시험 대비 +10점', sourcePath: 'emblems/core/score_ten_point_leap.png' },
  { id: 'score_steady_improvement', title: '꾸준한 성장', category: 'core', condition: '3회 이상 성장 추세 지속', sourcePath: 'emblems/core/score_steady_improvement.png' },
  { id: 'score_comeback_growth', title: '역전 성장', category: 'core', condition: '하락 후 다음 시험 회복', sourcePath: 'emblems/core/score_comeback_growth.png' },
  { id: 'score_personal_best', title: '최고 기록 갱신', category: 'core', condition: '개인 최고점 갱신', sourcePath: 'emblems/core/score_personal_best.png' },
  { id: 'score_90_club', title: '90점 클럽', category: 'core', condition: '단일 시험 90점 이상', sourcePath: 'emblems/core/score_90_club.png' },
  { id: 'score_perfect_score', title: '만점의 신', category: 'core', condition: '단일 시험 100점', sourcePath: 'emblems/core/score_perfect_score.png' },
  { id: 'score_top_tier_entry', title: '상위권 진입', category: 'core', condition: '특정 백분위/등급 도달', sourcePath: 'emblems/core/score_top_tier_entry.png' },
  { id: 'rival_first_comparison', title: '첫 성장 비교', category: 'core', condition: 'Rival 매치업 첫 우위', sourcePath: 'emblems/core/rival_first_comparison.png' },
  { id: 'rival_victory', title: 'Rival 승리', category: 'core', condition: 'Rival 매치 승리', sourcePath: 'emblems/core/rival_victory.png' },
  { id: 'rival_chaser', title: 'Rival 추격자', category: 'core', condition: 'Rival과의 격차 감소', sourcePath: 'emblems/core/rival_chaser.png' },
  { id: 'rival_leader', title: 'Rival 선도자', category: 'core', condition: 'Rival 평균보다 앞섬', sourcePath: 'emblems/core/rival_leader.png' },
  { id: 'rival_rising_streak', title: '연속 상승 흐름', category: 'core', condition: 'Rival 매치 3회 연속 우위', sourcePath: 'emblems/core/rival_rising_streak.png' },
  { id: 'rival_revenge_success', title: '복수 성공', category: 'core', condition: '이전 패배 후 재대결 승리', sourcePath: 'emblems/core/rival_revenge_success.png' },
  { id: 'rival_growth_highlight', title: '성장 하이라이트', category: 'core', condition: 'Rival 우위 누적 10회', sourcePath: 'emblems/core/rival_growth_highlight.png' },
  { id: 'sp_milestone', title: 'SP 마일스톤', category: 'core', condition: '주요 누적 SP 기준 달성', sourcePath: 'emblems/core/sp_milestone.png' },

  { id: 'hidden_genius', title: '숨겨진 천재', category: 'hidden', condition: '관리자 수동 지급 또는 특수 성취 인정', sourcePath: 'emblems/hidden/hidden_genius.png' },
  { id: 'hidden_perfect_score_deity', title: '만점의 신', category: 'hidden', condition: '단일 시험 100점', sourcePath: 'emblems/hidden/hidden_perfect_score_deity.png' },
  { id: 'hidden_comeback_proof', title: '역전의 증명', category: 'hidden', condition: '큰 하락 후 의미 있는 회복', sourcePath: 'emblems/hidden/hidden_comeback_proof.png' },
  { id: 'hidden_quiet_elite', title: '조용한 강자', category: 'hidden', condition: 'Rival 없이 4주 이상 상위 성장', sourcePath: 'emblems/hidden/hidden_quiet_elite.png' },
  { id: 'hidden_revenge_success', title: '복수 성공', category: 'hidden', condition: 'Rival 패배 후 재대결 승리', sourcePath: 'emblems/hidden/hidden_revenge_success.png' },
  { id: 'hidden_flawless_routine', title: '무결점 루틴', category: 'hidden', condition: '출석·과제·복습·시험 루틴 모두 충족', sourcePath: 'emblems/hidden/hidden_flawless_routine.png' },
  { id: 'hidden_second_half_dominator', title: '후반부 지배자', category: 'hidden', condition: '시험 후반부 정확도 개선', sourcePath: 'emblems/hidden/hidden_second_half_dominator.png' },
  { id: 'hidden_concept_unlock', title: '개념 봉인 해제', category: 'hidden', condition: '같은 단원 개념 약점 3회 연속 개선', sourcePath: 'emblems/hidden/hidden_concept_unlock.png' },
  { id: 'hidden_axis_master_key', title: 'AXIS Master Key', category: 'hidden', condition: '핵심 계열 엠블럼 다수 달성', sourcePath: 'emblems/hidden/hidden_axis_master_key.png' },
  { id: 'hidden_axis_of_mathematics', title: '수학의 축', category: 'hidden', condition: '여러 과목 단원 마스터 누적 달성', sourcePath: 'emblems/hidden/hidden_axis_of_mathematics.png' },
  { id: 'hidden_season_pioneer', title: '시즌 선구자', category: 'hidden', condition: '시즌 내 최초 상위 성장 단계 진입', sourcePath: 'emblems/hidden/hidden_season_pioneer.png' },
  { id: 'hidden_teacher_recommended_growth', title: '선생님 추천 성장 포인트', category: 'hidden', condition: '교사 상담 근거로 직접 추천', sourcePath: 'emblems/hidden/hidden_teacher_recommended_growth.png' },

  { id: 'math_polynomial_conquest', title: '다항식 정복', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_polynomial_conquest.png' },
  { id: 'math_equation_inequality_breakthrough', title: '방정식·부등식 돌파', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_equation_inequality_breakthrough.png' },
  { id: 'math_analytic_geometry_designer', title: '도형의 방정식 설계자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_analytic_geometry_designer.png' },
  { id: 'math_set_logic_judge', title: '집합·명제 판별자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_set_logic_judge.png' },
  { id: 'math_function_interpreter', title: '함수 해석자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_function_interpreter.png' },
  { id: 'math_combinatorics_designer', title: '경우의 수 설계자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_combinatorics_designer.png' },
  { id: 'math_exponent_log_navigator', title: '지수로그 항해자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_exponent_log_navigator.png' },
  { id: 'math_trigonometry_harmonizer', title: '삼각함수 조율자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_trigonometry_harmonizer.png' },
  { id: 'math_sequence_pattern_master', title: '수열 패턴 마스터', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_sequence_pattern_master.png' },
  { id: 'math_limit_observer', title: '극한 관찰자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_limit_observer.png' },
  { id: 'math_derivative_tracker', title: '미분 추적자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_derivative_tracker.png' },
  { id: 'math_integral_designer', title: '적분 설계자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_integral_designer.png' },
  { id: 'math_sequence_limit_conqueror', title: '수열의 극한 정복', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_sequence_limit_conqueror.png' },
  { id: 'math_differential_calculus_master', title: '미분법 마스터', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_differential_calculus_master.png' },
  { id: 'math_integral_calculus_master', title: '적분법 마스터', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_integral_calculus_master.png' },
  { id: 'math_permutation_combination_strategist', title: '순열조합 전략가', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_permutation_combination_strategist.png' },
  { id: 'math_probability_judge', title: '확률 판단자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_probability_judge.png' },
  { id: 'math_statistics_interpreter', title: '통계 해석자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_statistics_interpreter.png' },
  { id: 'math_conic_explorer', title: '이차곡선 탐험가', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_conic_explorer.png' },
  { id: 'math_plane_vector_navigator', title: '평면벡터 항해자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_plane_vector_navigator.png' },
  { id: 'math_solid_geometry_architect', title: '공간도형 설계자', category: 'math_units', condition: '해당 단원 평가 통과/완성/마스터', sourcePath: 'emblems/math_units/math_solid_geometry_architect.png' },
];

export const EMBLEM_ASSETS: EmblemAssetEntry[] = EMBLEM_ASSET_META.map((m) => ({
  assetId: m.id,
  displayName: m.title,
  category: m.category,
  condition: m.condition,
  sourcePath: m.sourcePath,
  imageSrc: ASSET_ID_TO_IMAGE[m.id],
}));

function findAsset(assetId: string): EmblemAssetEntry | undefined {
  return EMBLEM_ASSETS.find((e) => e.assetId === assetId);
}

// ─── growthData.ts MOCK_EMBLEMS.id → 이 매니페스트의 assetId ─────────────────
// 이름/조건 문구가 명확히 일치하는 경우에만 연결했다(파일 상단 원칙 참고). 총 23건.
// 나머지 기존 엠블럼(emb-005/007/010/011/015/017/019~022/024~026, growth_streak_01)은
// 애매하거나 대응하는 자산이 없어 의도적으로 비워뒀다 — 계속 SVG로 렌더링된다.
export const EMBLEM_ID_TO_ASSET_ID: Record<string, string> = {
  'emb-001': 'habit_perfect_attendance',      // 개근왕
  'emb-002': 'habit_proof_of_diligence',      // 성실의 증거
  'emb-003': 'habit_iron_will',               // 철의 의지
  'emb-018': 'habit_assignment_finisher',     // 과제 완수자
  'emb-004': 'score_growth_seed',             // 성장의 씨앗
  'emb-006': 'score_ten_point_leap',          // 10점 도약
  'emb-008': 'score_90_club',                 // 90점 클럽
  'emb-009': 'hidden_perfect_score_deity',    // 만점의 신(기존 hidden:true와 일치하는 hidden 폴더 자산 사용)
  'emb-012': 'rival_victory',                 // 첫 승리
  'emb-013': 'rival_rising_streak',           // 연승 질주
  'emb-014': 'rival_growth_highlight',        // 라이벌 챔피언(누적 10승)
  'emb-016': 'hidden_genius',                 // 숨겨진 천재
  'emb-023': 'rival_revenge_success',         // 리벤지 성공
  'emb-027': 'hidden_season_pioneer',         // 시즌 한정: 선구자
  'calc_precision_01': 'if_calculation_precision',
  'concept_mastery_01': 'if_concept_mastery',
  'time_control_01': 'if_time_control',
  'steady_improvement_01': 'score_steady_improvement',
  'comeback_growth_01': 'score_comeback_growth',
  'weekly_consistency_01': 'habit_weekly_consistency',
  'high_focus_01': 'habit_high_focus_session',
  'reflection_complete_01': 'habit_reflection_complete',
  'mentor_recommendation_01': 'hidden_teacher_recommended_growth',
};

/** 기존 엠블럼 id로 실제 이미지 URL을 찾는다. 매핑이 없으면 undefined
 *  (호출부에서 undefined면 기존 AxisEmblemBadge SVG로 fallback해야 한다). */
export function getEmblemImageByExistingId(existingEmblemId: string): string | undefined {
  const assetId = EMBLEM_ID_TO_ASSET_ID[existingEmblemId];
  if (!assetId) return undefined;
  return findAsset(assetId)?.imageSrc;
}

// ─── StudentTier → 이 매니페스트의 assetId ───────────────────────────────────
// TIER_LABELS(growthData.ts)와 이름이 정확히 1:1로 대응해 전부 연결했다(UNRANKED 제외).
export const TIER_TO_ASSET_ID: Partial<Record<StudentTier, string>> = {
  SEED: 'tier_seed',
  FOUNDATION: 'tier_foundation',
  FOCUS: 'tier_focus',
  STRATEGY: 'tier_strategy',
  MASTERY: 'tier_mastery',
  AXIS_MASTER: 'tier_axis_master',
};

/** Tier로 실제 이미지 URL을 찾는다. UNRANKED 등 매핑이 없으면 undefined(기존 SVG 메달리온 fallback). */
export function getTierImage(tier: StudentTier): string | undefined {
  const assetId = TIER_TO_ASSET_ID[tier];
  if (!assetId) return undefined;
  return findAsset(assetId)?.imageSrc;
}
