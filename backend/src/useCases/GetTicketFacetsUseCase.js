/**
 * GetTicketFacetsUseCase — Use Case
 *
 * Retrieves distinct category and priority values across all tickets.
 * Used by the frontend to populate filter dropdowns dynamically.
 *
 * @see DESIGN.md §3 (Use Cases layer)
 */

class GetTicketFacetsUseCase {
  constructor(ticketRepository) {
    this.ticketRepository = ticketRepository;
  }

  async execute() {
    return this.ticketRepository.getDistinctFacets();
  }
}

module.exports = GetTicketFacetsUseCase;
