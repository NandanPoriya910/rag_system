// roles.js: single source of truth for roles and department access.

export const ROLES = {
  ADMIN: 'ADMIN',
  HR: 'HR',
  FINANCE: 'FINANCE',
  EMPLOYEE: 'EMPLOYEE',
};

// Partitions of the knowledge base. Each department has its own FAISS index.
export const DEPARTMENTS = ['HR', 'FINANCE', 'GENERAL'];

// Which departments' data each role may read by default.
export const ROLE_DEPARTMENTS = {
  ADMIN: ['HR', 'FINANCE', 'GENERAL'],
  HR: ['HR', 'GENERAL'],
  FINANCE: ['FINANCE', 'GENERAL'],
  EMPLOYEE: ['GENERAL'],
};
