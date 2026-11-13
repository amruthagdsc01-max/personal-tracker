// Tiny constructors that keep lesson data compact and uniform.
/** multiple-choice question: q, options, index of the right option, why it is right */
export const mc = (q, o, a, why, kind = 'concept') => ({ q, o, a, why, kind })
/** rubric point: text shown to the learner + keywords used to pre-tick it */
export const pt = (t, ...k) => ({ t, k })
export const ref = (label, url, why) => ({ label, url, why })
