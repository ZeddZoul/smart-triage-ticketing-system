const RegisterAgentUseCase = require('../../../src/useCases/RegisterAgentUseCase');
const FakeAgentRepository = require('../../helpers/fakeAgentRepository');
const FakeAuthService = require('../../helpers/fakeAuthService');
const { ConflictError } = require('../../../src/entities/errors');

describe('RegisterAgentUseCase', () => {
  test("Happy path: agent created with hashed password, default role 'agent'", async () => {
    const repo = new FakeAgentRepository();
    const auth = new FakeAuthService();
    const useCase = new RegisterAgentUseCase(repo, auth);

    const result = await useCase.execute({
      email: 'new-agent@example.com',
      password: 'StrongPass123!',
      name: 'New Agent',
    });

    expect(result.id).toBeDefined();
    expect(result.email).toBe('new-agent@example.com');
    expect(result.role).toBe('agent');

    const stored = await repo.findByEmail('new-agent@example.com');
    expect(stored.password_hash).toBe('hashed_StrongPass123!');
  });

  test('Duplicate email -> ConflictError', async () => {
    const repo = new FakeAgentRepository();
    const auth = new FakeAuthService();
    const useCase = new RegisterAgentUseCase(repo, auth);

    await useCase.execute({
      email: 'dup@example.com',
      password: 'abc12345',
      name: 'First',
    });

    await expect(
      useCase.execute({ email: 'dup@example.com', password: 'different123', name: 'Second' }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  test('Response excludes passwordHash', async () => {
    const repo = new FakeAgentRepository();
    const auth = new FakeAuthService();
    const useCase = new RegisterAgentUseCase(repo, auth);

    const result = await useCase.execute({
      email: 'safe@example.com',
      password: 'safePassword1',
      name: 'Safe Agent',
    });

    expect(result.password_hash).toBeUndefined();
  });
});
