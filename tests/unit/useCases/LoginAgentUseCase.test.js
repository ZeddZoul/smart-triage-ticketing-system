const LoginAgentUseCase = require('../../../src/useCases/LoginAgentUseCase');
const FakeAgentRepository = require('../../helpers/fakeAgentRepository');
const FakeAuthService = require('../../helpers/fakeAuthService');
const { UnauthorizedError } = require('../../../src/entities/errors');

describe('LoginAgentUseCase', () => {
  test('Valid credentials -> returns token + agent profile', async () => {
    const repo = new FakeAgentRepository();
    const auth = new FakeAuthService();
    await repo.create({
      email: 'agent@example.com',
      password_hash: await auth.hashPassword('Password123!'),
      name: 'Agent Name',
      role: 'agent',
    });

    const useCase = new LoginAgentUseCase(repo, auth);
    const result = await useCase.execute({ email: 'agent@example.com', password: 'Password123!' });

    expect(result.token).toBeDefined();
    expect(result.agent.email).toBe('agent@example.com');
    expect(result.agent).not.toHaveProperty('password_hash');
  });

  test('Wrong password -> UnauthorizedError (generic message)', async () => {
    const repo = new FakeAgentRepository();
    const auth = new FakeAuthService();
    await repo.create({
      email: 'agent@example.com',
      password_hash: await auth.hashPassword('RightPassword'),
      name: 'Agent Name',
      role: 'agent',
    });

    const useCase = new LoginAgentUseCase(repo, auth);

    await expect(
      useCase.execute({ email: 'agent@example.com', password: 'WrongPassword' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      useCase.execute({ email: 'agent@example.com', password: 'WrongPassword' }),
    ).rejects.toThrow('Invalid credentials');
  });

  test('Non-existent email -> UnauthorizedError (same generic message)', async () => {
    const useCase = new LoginAgentUseCase(new FakeAgentRepository(), new FakeAuthService());

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'any' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'any' }),
    ).rejects.toThrow('Invalid credentials');
  });
});
