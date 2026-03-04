const { format, formatList } = require('../presenters/ticketPresenter');

class TicketController {
  constructor(createTicketUseCase, getTicketsUseCase, getTicketByIdUseCase, updateTicketStatusUseCase, retriageTicketUseCase, getTicketHistoryUseCase, getTicketFacetsUseCase) {
    this.createTicketUseCase = createTicketUseCase;
    this.getTicketsUseCase = getTicketsUseCase;
    this.getTicketByIdUseCase = getTicketByIdUseCase;
    this.updateTicketStatusUseCase = updateTicketStatusUseCase;
    this.retriageTicketUseCase = retriageTicketUseCase;
    this.getTicketHistoryUseCase = getTicketHistoryUseCase;
    this.getTicketFacetsUseCase = getTicketFacetsUseCase;

    this.create = this.create.bind(this);
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.retriage = this.retriage.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.getFacets = this.getFacets.bind(this);
  }

  async create(req, res, next) {
    try {
      const { title, description, customer_email } = req.body;
      const ticket = await this.createTicketUseCase.execute({ title, description, customer_email });
      return res.status(201).json(format(ticket));
    } catch (error) {
      return next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await this.getTicketsUseCase.execute(req.query || {});
      return res.status(200).json(formatList(result));
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const ticket = await this.getTicketByIdUseCase.execute(req.params.id);
      return res.status(200).json(format(ticket));
    } catch (error) {
      return next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const ticketId = req.params.id;
      const newStatus = req.body.status;
      const agentId = req.agent?.agentId;

      const updated = await this.updateTicketStatusUseCase.execute({ ticketId, newStatus, agentId });
      return res.status(200).json(format(updated));
    } catch (error) {
      return next(error);
    }
  }

  async retriage(req, res, next) {
    try {
      const ticketId = req.params.id;
      const agentId = req.agent?.agentId;

      const ticket = await this.retriageTicketUseCase.execute({ ticketId, agentId });
      return res.status(200).json(format(ticket));
    } catch (error) {
      return next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const history = await this.getTicketHistoryUseCase.execute(req.params.id);
      return res.status(200).json(history);
    } catch (error) {
      return next(error);
    }
  }

  async getFacets(req, res, next) {
    try {
      const facets = await this.getTicketFacetsUseCase.execute();
      return res.status(200).json(facets);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = TicketController;
