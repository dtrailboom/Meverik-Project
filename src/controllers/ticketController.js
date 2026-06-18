const Ticket = require('../models/Ticket');
const User = require('../models/User');
const {
  sendTicketSubmittedEmail,
  sendTicketInProgressEmail,
  sendTicketDeliveredEmail,
  sendLowTokenWarningEmail,
  sendAdminNewTicketEmail,
} = require('../services/emailService');

const LOW_TOKEN_THRESHOLD = 3;

// POST /portal/api/tickets — submit a new request
const createTicket = async (req, res) => {
  try {
    const { title, description, complexity, referenceUrl } = req.body;

    const ticket = await Ticket.create({
      client: req.user._id,
      title,
      description,
      complexity,
      referenceUrl,
      tokenCost: req.tokenCost,
    });

    // Deduct tokens
    await req.user.deductTokens(req.tokenCost);
    const updatedUser = await User.findById(req.user._id);

    // Email: client confirmation
    sendTicketSubmittedEmail({
      to: updatedUser.email,
      name: updatedUser.name,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      complexity: ticket.complexity,
      tokenCost: ticket.tokenCost,
      tokensRemaining: updatedUser.tokenBalance,
      portalUrl: process.env.APP_URL + '/portal',
    });

    // Email: admin notification
    sendAdminNewTicketEmail({
      ticketNumber: ticket.ticketNumber,
      clientName: updatedUser.name,
      clientEmail: updatedUser.email,
      title: ticket.title,
      complexity: ticket.complexity,
      tokenCost: ticket.tokenCost,
      adminUrl: process.env.APP_URL + '/admin',
    });

    // Email: low token warning if balance is low
    if (updatedUser.tokenBalance <= LOW_TOKEN_THRESHOLD && updatedUser.tokenBalance > 0) {
      sendLowTokenWarningEmail({
        to: updatedUser.email,
        name: updatedUser.name,
        tokenBalance: updatedUser.tokenBalance,
        portalUrl: process.env.APP_URL + '/portal',
      });
    }

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

// GET /portal/api/tickets — list tickets for logged-in client
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

// GET /admin/api/tickets — list all tickets (admin only)
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

// PATCH /admin/api/tickets/:id — update ticket status / reply (admin only)
const updateTicketStatus = async (req, res) => {
  try {
    const { status, notes, adminReply } = req.body;
    const validStatuses = ['new', 'in_progress', 'in_review', 'delivered', 'blocked'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const update = { status };
    if (notes) update.notes = notes;

    // Bug 2C — admin reply to the client (empty string clears it)
    if (adminReply !== undefined) {
      const trimmed = (adminReply || '').trim();
      update.adminReply = trimmed;
      update.adminReplyAt = trimmed ? new Date() : null;
    }

    if (status === 'delivered') update.deliveredAt = new Date();

    const ticket = await Ticket.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('client', 'name email websiteUrl');

    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    const client = ticket.client;
    const portalUrl = process.env.APP_URL + '/portal';

    // Send email based on new status
    if (status === 'in_progress') {
      sendTicketInProgressEmail({
        to: client.email,
        name: client.name,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        portalUrl,
      });
    }

    if (status === 'delivered') {
      sendTicketDeliveredEmail({
        to: client.email,
        name: client.name,
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        websiteUrl: client.websiteUrl,
        portalUrl,
      });
    }

    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update ticket.' });
  }
};

module.exports = { createTicket, getClientTickets, getAllTickets, updateTicketStatus };
