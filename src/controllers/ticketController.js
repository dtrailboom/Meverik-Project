const Ticket = require('../models/Ticket');
const User = require('../models/User');

// POST /portal/tickets — submit a new request
const createTicket = async (req, res) => {
  try {
    const { title, description, complexity, referenceUrl } = req.body;

    // req.user and req.tokenCost set by checkTokenBalance middleware
    const ticket = await Ticket.create({
      client: req.user._id,
      title,
      description,
      complexity,
      referenceUrl,
      tokenCost: req.tokenCost,
    });

    // Deduct tokens from user
    await req.user.deductTokens(req.tokenCost);

    res.json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        status: ticket.status,
        tokenCost: ticket.tokenCost,
      },
    });
  } catch (err) {
    console.error('Create ticket error:', err);
    res.status(500).json({ error: 'Failed to submit request. Please try again.' });
  }
};

// GET /portal/tickets — list tickets for logged-in client
const getClientTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ client: req.session.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tickets.' });
  }
};

// GET /admin/tickets — list all tickets (admin only)
const getAllTickets = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const tickets = await Ticket.find(filter)
      .populate('client', 'name businessName email tokenBalance')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ tickets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load tickets.' });
  }
};

// PATCH /admin/tickets/:id — update ticket status (admin only)
const updateTicketStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['new', 'in_progress', 'in_review', 'delivered', 'blocked'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const update = { status };
    if (notes) update.notes = notes;
    if (status === 'delivered') update.deliveredAt = new Date();

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('client', 'name email');

    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket.' });
  }
};

module.exports = { createTicket, getClientTickets, getAllTickets, updateTicketStatus };
