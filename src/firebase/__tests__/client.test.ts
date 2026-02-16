describe('firebase/client', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('initializes a new app when there are no existing apps', async () => {
    const appMock = { name: 'new-app' };
    const authMock = { kind: 'auth' };
    const dbMock = { kind: 'db' };

    jest.doMock('firebase/app', () => ({
      initializeApp: jest.fn(() => appMock),
      getApps: jest.fn(() => []),
      getApp: jest.fn(),
    }));
    jest.doMock('firebase/auth', () => ({
      getAuth: jest.fn(() => authMock),
    }));
    jest.doMock('firebase/firestore', () => ({
      getFirestore: jest.fn(() => dbMock),
    }));

    const mod = await import('../client');
    const firebaseApp = await import('firebase/app');
    const firebaseAuth = await import('firebase/auth');
    const firebaseFirestore = await import('firebase/firestore');

    expect(firebaseApp.getApps).toHaveBeenCalledTimes(1);
    expect(firebaseApp.initializeApp).toHaveBeenCalledTimes(1);
    expect(firebaseApp.getApp).not.toHaveBeenCalled();

    expect(firebaseAuth.getAuth).toHaveBeenCalledWith(appMock);
    expect(firebaseFirestore.getFirestore).toHaveBeenCalledWith(appMock);
    expect(mod.auth).toBe(authMock);
    expect(mod.db).toBe(dbMock);
    expect(mod.default).toBe(appMock);
  });

  it('reuses existing app when one is already initialized', async () => {
    const appMock = { name: 'existing-app' };

    jest.doMock('firebase/app', () => ({
      initializeApp: jest.fn(),
      getApps: jest.fn(() => [appMock]),
      getApp: jest.fn(() => appMock),
    }));
    jest.doMock('firebase/auth', () => ({
      getAuth: jest.fn(() => ({ kind: 'auth' })),
    }));
    jest.doMock('firebase/firestore', () => ({
      getFirestore: jest.fn(() => ({ kind: 'db' })),
    }));

    const mod = await import('../client');
    const firebaseApp = await import('firebase/app');

    expect(firebaseApp.getApps).toHaveBeenCalledTimes(1);
    expect(firebaseApp.getApp).toHaveBeenCalledTimes(1);
    expect(firebaseApp.initializeApp).not.toHaveBeenCalled();
    expect(mod.default).toBe(appMock);
  });
});
