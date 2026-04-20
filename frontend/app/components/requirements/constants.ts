// Maps backend domain keys → display labels
export const DOMAIN_DISPLAY: Record<string, string> = {
  '人文藝術領域':   '人文與藝術通識領域',
  '自然科技領域':   '自然與科技通識領域',
  '社會科學領域':   '社會科學通識領域',
  '永續素養通識領域': '永續素養通識領域',
  '通識領域自由選修': '通識領域自由選修',
};

// Maps backend domain keys → audit_category prefix used on CourseRecord
export const DOMAIN_AUDIT_PREFIX: Record<string, string> = {
  '人文藝術領域':   '通識-人文',
  '自然科技領域':   '通識-自然',
  '社會科學領域':   '通識-社會',
  '永續素養通識領域': '通識-永續',
  '通識領域自由選修': '通識-自由',
};
