type AppModuleMocks = {
  initializeApp: jest.Mock;
  getApps: jest.Mock;
  applicationDefault: jest.Mock;
};

type ServiceModuleMocks = {
  getAuth: jest.Mock;
  getFirestore: jest.Mock;
};

async function loadServerModule(existingApps: unknown[]): Promise<{
  mod: {
    serverAuth: unknown;
    serverDb: unknown;
  };
  appMocks: AppModuleMocks;
  serviceMocks: ServiceModuleMocks;
}> {
  jest.resetModules();

  const appMocks: AppModuleMocks = {
    initializeApp: jest.fn(),
    getApps: jest.fn(() => existingApps),
    applicationDefault: jest.fn(() => 'app-default-credential'),
  };

  const serviceMocks: ServiceModuleMocks = {
    getAuth: jest.fn(() => 'mock-server-auth'),
    getFirestore: jest.fn(() => 'mock-server-db'),
  };

  appMocks.initializeApp.mockReturnValue({ appName: 'initialized-app' });

  jest.doMock('firebase-admin/app', () => ({
    initializeApp: appMocks.initializeApp,
    getApps: appMocks.getApps,
    applicationDefault: appMocks.applicationDefault,
  }));

  jest.doMock('firebase-admin/auth', () => ({
    getAuth: serviceMocks.getAuth,
  }));

  jest.doMock('firebase-admin/firestore', () => ({
    getFirestore: serviceMocks.getFirestore,
  }));

  const mod = await import('../server');

  return { mod, appMocks, serviceMocks };
}

describe('firebase/server bootstrap', () => {
  it('initializes firebase-admin app when no app exists', async () => {
    const { mod, appMocks, serviceMocks } = await loadServerModule([]);

    expect(appMocks.initializeApp).toHaveBeenCalledWith({
      credential: 'app-default-credential',
    });
    expect(appMocks.applicationDefault).toHaveBeenCalledTimes(1);
    expect(serviceMocks.getAuth).toHaveBeenCalledWith({ appName: 'initialized-app' });
    expect(serviceMocks.getFirestore).toHaveBeenCalledWith({ appName: 'initialized-app' });
    expect(mod.serverAuth).toBe('mock-server-auth');
    expect(mod.serverDb).toBe('mock-server-db');
  });

  it('reuses first existing app when already initialized', async () => {
    const existingApp = { appName: 'existing-app' };
    const { mod, appMocks, serviceMocks } = await loadServerModule([existingApp]);

    expect(appMocks.initializeApp).not.toHaveBeenCalled();
    expect(serviceMocks.getAuth).toHaveBeenCalledWith(existingApp);
    expect(serviceMocks.getFirestore).toHaveBeenCalledWith(existingApp);
    expect(mod.serverAuth).toBe('mock-server-auth');
    expect(mod.serverDb).toBe('mock-server-db');
  });
});
