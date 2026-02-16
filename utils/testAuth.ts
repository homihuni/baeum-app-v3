import { createParent, getParent } from './firestore';

const TEST_PARENT_ID = 'test-parent-001';

export const testLogin = async () => {
  const existing = await getParent(TEST_PARENT_ID);
  if (!existing) {
    await createParent(TEST_PARENT_ID, {
      email: 'test@baeum.app',
      name: '테스트 부모',
      loginType: 'google',
    });
  }
  return {
    parentId: TEST_PARENT_ID,
    email: 'test@baeum.app',
    name: '테스트 부모',
  };
};

export { TEST_PARENT_ID };
