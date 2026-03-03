class AuthController {
  constructor(registerAgentUseCase, loginAgentUseCase) {
    this.registerAgentUseCase = registerAgentUseCase;
    this.loginAgentUseCase = loginAgentUseCase;

    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
  }

  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;
      const agent = await this.registerAgentUseCase.execute({ email, password, name });
      return res.status(201).json(agent);
    } catch (error) {
      return next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.loginAgentUseCase.execute({ email, password });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = AuthController;
