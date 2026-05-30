// server/controllers/leaveController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const isAdmin = ['ADMIN', 'HR', 'MANAGER'].includes(req.user.role);
    const where = isAdmin ? {} : { employee: { userId: req.user.id } };

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { name: true, designation: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.apply = async (req, res) => {
  try {
    const { type, fromDate, toDate, reason } = req.body;
    const employee = await prisma.employee.findUnique({ where: { userId: req.user.id } });
    if (!employee) return res.status(404).json({ error: 'Employee profile not found' });

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        type,
        fromDate: new Date(fromDate),
        toDate:   new Date(toDate),
        reason,
      },
    });
    res.status(201).json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const leave = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: { status, approvedBy: req.user.id },
    });
    res.json(leave);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
