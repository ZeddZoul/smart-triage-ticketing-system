const { TicketStatus, TicketCategory, TicketPriority, AgentRole, HistoryAction } = require('../../src/entities/enums');

function objectIdLike() {
  return Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function createTicketData(overrides = {}) {
  return {
    title: 'Unable to login after password reset',
    description: 'I reset my password and now login fails with an unknown error.',
    customer_email: 'customer@example.com',
    status: TicketStatus.PENDING_TRIAGE,
    category: null,
    priority: null,
    triage_attempts: 0,
    ...overrides,
  };
}

function createAgentData(overrides = {}) {
  return {
    email: 'agent@example.com',
    password_hash: 'hashed_password_123',
    name: 'Support Agent',
    role: AgentRole.AGENT,
    ...overrides,
  };
}

function createTicket(overrides = {}) {
  const now = new Date();
  return {
    id: objectIdLike(),
    ...createTicketData(),
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function createAgent(overrides = {}) {
  const now = new Date();
  return {
    id: objectIdLike(),
    ...createAgentData(),
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function createHistoryData(overrides = {}) {
  return {
    ticket_id: objectIdLike(),
    action: HistoryAction.CREATED,
    performed_by_agent_id: null,
    previous_value: null,
    new_value: null,
    notes: null,
    ...overrides,
  };
}

function createHistory(overrides = {}) {
  return {
    id: objectIdLike(),
    ...createHistoryData(),
    created_at: new Date(),
    ...overrides,
  };
}

module.exports = {
  objectIdLike,
  createTicketData,
  createAgentData,
  createTicket,
  createAgent,
  createHistoryData,
  createHistory,
  TicketStatus,
  TicketCategory,
  TicketPriority,
  AgentRole,
};
