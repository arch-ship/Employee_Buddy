// server/controllers/employeeController.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAll = async (req, res) => {
  try {
    const { search, department, status, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = {};
    if (status) where.status = status;
    if (department) where.departmentId = department;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          department: true,
          user: { select: { email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
    ]);

    res.json({ employees, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: {
        department: true,
        user: { select: { email: true, role: true } },
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { email, password, name, phone, designation, salary, joinDate, departmentId, role } = req.body;

    const bcrypt = require('bcryptjs');
    const hash = password ? await bcrypt.hash(password, 12) : undefined;

    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        role: role || 'EMPLOYEE',
        employee: {
          create: {
            name,
            phone,
            designation,
            salary: salary ? parseFloat(salary) : null,
            joinDate: joinDate ? new Date(joinDate) : null,
            departmentId: departmentId || null,
          },
        },
      },
      include: { employee: true },
    });

    res.status(201).json(user.employee);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, phone, designation, salary, status, departmentId, joinDate } = req.body;

    const emp = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        name, phone, designation, status,
        departmentId: departmentId || null,
        salary: salary ? parseFloat(salary) : undefined,
        joinDate: joinDate ? new Date(joinDate) : undefined,
      },
      include: { department: true, user: { select: { email: true, role: true } } },
    });

    res.json(emp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    // Cascade deletes employee + user via Prisma schema
    const emp = await prisma.employee.findUnique({ where: { id: req.params.id } });
    if (!emp) return res.status(404).json({ error: 'Not found' });

    await prisma.user.delete({ where: { id: emp.userId } });
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
