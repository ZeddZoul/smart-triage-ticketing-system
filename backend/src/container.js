const { loadConfig } = require('./infrastructure/config/env');

const MongoTicketRepository = require('./infrastructure/database/repositories/MongoTicketRepository');
const MongoAgentRepository = require('./infrastructure/database/repositories/MongoAgentRepository');
const MongoTicketHistoryRepository = require('./infrastructure/database/repositories/MongoTicketHistoryRepository');

const JwtAuthService = require('./infrastructure/auth/JwtAuthService');
const GeminiTriageService = require('./infrastructure/ai/GeminiTriageService');

const TriageTicketUseCase = require('./useCases/TriageTicketUseCase');
const CreateTicketUseCase = require('./useCases/CreateTicketUseCase');
const GetTicketsUseCase = require('./useCases/GetTicketsUseCase');
const GetTicketByIdUseCase = require('./useCases/GetTicketByIdUseCase');
const UpdateTicketStatusUseCase = require('./useCases/UpdateTicketStatusUseCase');
const RetriageTicketUseCase = require('./useCases/RetriageTicketUseCase');
const GetTicketHistoryUseCase = require('./useCases/GetTicketHistoryUseCase');
const RegisterAgentUseCase = require('./useCases/RegisterAgentUseCase');
const LoginAgentUseCase = require('./useCases/LoginAgentUseCase');

const TicketController = require('./interfaces/controllers/ticketController');
const AuthController = require('./interfaces/controllers/authController');

const authMiddlewareFactory = require('./infrastructure/middleware/authMiddleware');
const validationMiddleware = require('./infrastructure/middleware/validationMiddleware');

function createContainer(overrides = {}) {
  const config = overrides.config || loadConfig();

  const ticketRepository = overrides.ticketRepository || new MongoTicketRepository();
  const agentRepository = overrides.agentRepository || new MongoAgentRepository();
  const ticketHistoryRepository =
    overrides.ticketHistoryRepository || new MongoTicketHistoryRepository();

  const authService = overrides.authService || new JwtAuthService(config);
  const aiTriageService = overrides.aiTriageService || new GeminiTriageService(config);

  const triageTicketUseCase =
    overrides.triageTicketUseCase ||
    new TriageTicketUseCase(ticketRepository, ticketHistoryRepository, aiTriageService, {
      maxRetries: config.maxTriageRetries,
    });

  const createTicketUseCase =
    overrides.createTicketUseCase ||
    new CreateTicketUseCase(ticketRepository, ticketHistoryRepository, triageTicketUseCase);
  const getTicketsUseCase = overrides.getTicketsUseCase || new GetTicketsUseCase(ticketRepository);
  const getTicketByIdUseCase =
    overrides.getTicketByIdUseCase || new GetTicketByIdUseCase(ticketRepository);
  const updateTicketStatusUseCase =
    overrides.updateTicketStatusUseCase ||
    new UpdateTicketStatusUseCase(ticketRepository, ticketHistoryRepository);
  const retriageTicketUseCase =
    overrides.retriageTicketUseCase ||
    new RetriageTicketUseCase(ticketRepository, ticketHistoryRepository, triageTicketUseCase);
  const getTicketHistoryUseCase =
    overrides.getTicketHistoryUseCase ||
    new GetTicketHistoryUseCase(ticketRepository, ticketHistoryRepository);
  const registerAgentUseCase =
    overrides.registerAgentUseCase || new RegisterAgentUseCase(agentRepository, authService);
  const loginAgentUseCase =
    overrides.loginAgentUseCase || new LoginAgentUseCase(agentRepository, authService);

  const ticketController =
    overrides.ticketController ||
    new TicketController(
      createTicketUseCase,
      getTicketsUseCase,
      getTicketByIdUseCase,
      updateTicketStatusUseCase,
      retriageTicketUseCase,
      getTicketHistoryUseCase,
    );
  const authController =
    overrides.authController || new AuthController(registerAgentUseCase, loginAgentUseCase);

  const authMiddleware = authMiddlewareFactory(authService);

  return {
    config,

    repositories: {
      ticketRepository,
      agentRepository,
      ticketHistoryRepository,
    },
    services: {
      authService,
      aiTriageService,
    },
    useCases: {
      createTicketUseCase,
      triageTicketUseCase,
      getTicketsUseCase,
      getTicketByIdUseCase,
      updateTicketStatusUseCase,
      retriageTicketUseCase,
      getTicketHistoryUseCase,
      registerAgentUseCase,
      loginAgentUseCase,
    },
    controllers: {
      ticketController,
      authController,
    },
    middleware: {
      authMiddleware,
      validationMiddleware,
    },
  };
}

module.exports = {
  createContainer,
};
