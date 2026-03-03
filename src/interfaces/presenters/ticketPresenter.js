function format(ticket) {
  if (!ticket) return null;

  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    customer_email: ticket.customer_email,
    status: ticket.status,
    category: ticket.category ?? null,
    priority: ticket.priority ?? null,
    triage_attempts: ticket.triage_attempts ?? 0,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
  };
}

function formatList(result) {
  return {
    data: (result.data || []).map(format),
    pagination: result.pagination,
  };
}

module.exports = {
  format,
  formatList,
};
