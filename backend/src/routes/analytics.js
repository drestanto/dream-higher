import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// Get summary stats
router.get('/summary', async (req, res) => {
  try {
    const { period = 'today' } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startDate },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    const salesTransactions = transactions.filter((t) => t.type === 'OUT');
    const purchaseTransactions = transactions.filter((t) => t.type === 'IN');

    const totalSales = salesTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalPurchases = purchaseTransactions.reduce((sum, t) => sum + t.totalAmount, 0);

    // Calculate profit (sales revenue - cost of goods sold)
    let costOfGoodsSold = 0;
    for (const t of salesTransactions) {
      for (const item of t.items) {
        costOfGoodsSold += item.product.buyPrice * item.quantity;
      }
    }
    const netProfit = totalSales - costOfGoodsSold;

    res.json({
      period,
      totalSales,
      totalPurchases,
      netProfit,
      transactionCount: transactions.length,
      salesCount: salesTransactions.length,
      purchaseCount: purchaseTransactions.length,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// Get revenue over time (includes purchases and profit)
router.get('/revenue', async (req, res) => {
  try {
    const { from, to, groupBy = 'day' } = req.query;

    const startDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = to ? new Date(to) : new Date();

    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // Group by date
    const dataByDate = {};
    for (const t of transactions) {
      const date = t.completedAt.toISOString().slice(0, 10);
      if (!dataByDate[date]) {
        dataByDate[date] = { revenue: 0, purchases: 0, cost: 0, count: 0 };
      }

      dataByDate[date].count += 1;

      if (t.type === 'OUT') {
        dataByDate[date].revenue += t.totalAmount;
        // Calculate cost of goods sold
        for (const item of t.items) {
          dataByDate[date].cost += item.product.buyPrice * item.quantity;
        }
      } else if (t.type === 'IN') {
        dataByDate[date].purchases += t.totalAmount;
      }
    }

    // Fill in missing dates
    const result = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().slice(0, 10);
      const data = dataByDate[dateStr] || { revenue: 0, purchases: 0, cost: 0, count: 0 };
      result.push({
        date: dateStr,
        revenue: data.revenue,
        purchases: data.purchases,
        profit: data.revenue - data.cost,
        cost: data.cost,
        transactionCount: data.count,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching revenue:', error);
    res.status(500).json({ error: 'Failed to fetch revenue' });
  }
});

// Get top products
router.get('/top-products', async (req, res) => {
  try {
    const { limit = 10, period = 'week' } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          status: 'COMPLETED',
          type: 'OUT',
          completedAt: { gte: startDate },
        },
      },
      include: { product: true },
    });

    // Aggregate by product
    const productStats = {};
    for (const item of items) {
      const pid = item.productId;
      if (!productStats[pid]) {
        productStats[pid] = {
          product: item.product,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      productStats[pid].totalQuantity += item.quantity;
      productStats[pid].totalRevenue += item.quantity * item.unitPrice;
    }

    // Sort and limit
    const sorted = Object.values(productStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, parseInt(limit));

    res.json(sorted);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
});

// Get category breakdown
router.get('/categories', async (req, res) => {
  try {
    const { period = 'week' } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const items = await prisma.transactionItem.findMany({
      where: {
        transaction: {
          status: 'COMPLETED',
          type: 'OUT',
          completedAt: { gte: startDate },
        },
      },
      include: { product: true },
    });

    // Aggregate by category
    const categoryStats = {};
    for (const item of items) {
      const cat = item.product.category;
      if (!categoryStats[cat]) {
        categoryStats[cat] = { category: cat, totalRevenue: 0, totalQuantity: 0 };
      }
      categoryStats[cat].totalRevenue += item.quantity * item.unitPrice;
      categoryStats[cat].totalQuantity += item.quantity;
    }

    res.json(Object.values(categoryStats));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get hourly pattern
router.get('/hourly-pattern', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        type: 'OUT',
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Initialize hourly buckets
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      revenue: 0,
      count: 0,
    }));

    for (const t of transactions) {
      const hour = t.completedAt.getHours();
      hourlyData[hour].revenue += t.totalAmount;
      hourlyData[hour].count += 1;
    }

    res.json(hourlyData);
  } catch (error) {
    console.error('Error fetching hourly pattern:', error);
    res.status(500).json({ error: 'Failed to fetch hourly pattern' });
  }
});

// Get low stock products
router.get('/low-stock', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock: { lte: prisma.product.fields.lowStockThreshold },
      },
      orderBy: { stock: 'asc' },
    });

    // Manual filter since Prisma doesn't support comparing fields directly
    const lowStockProducts = await prisma.product.findMany({
      orderBy: { stock: 'asc' },
    });

    const filtered = lowStockProducts.filter((p) => p.stock <= p.lowStockThreshold);

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching low stock:', error);
    res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
});

// Get weekly report
router.get('/weekly-report', async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - 7));
    const prevWeekStart = new Date(new Date().setDate(new Date().getDate() - 14));
    const prevWeekEnd = new Date(new Date().setDate(new Date().getDate() - 7));

    // Current week
    const currentWeekTx = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: weekStart },
      },
      include: { items: { include: { product: true } } },
    });

    // Previous week
    const prevWeekTx = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: prevWeekStart, lt: prevWeekEnd },
      },
    });

    const currentSales = currentWeekTx
      .filter((t) => t.type === 'OUT')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const prevSales = prevWeekTx
      .filter((t) => t.type === 'OUT')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    const salesChange = prevSales > 0 ? ((currentSales - prevSales) / prevSales) * 100 : 0;

    // Best sellers
    const productCounts = {};
    for (const t of currentWeekTx.filter((t) => t.type === 'OUT')) {
      for (const item of t.items) {
        productCounts[item.product.name] = (productCounts[item.product.name] || 0) + item.quantity;
      }
    }

    const bestSellers = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    // Low stock
    const lowStock = await prisma.product.findMany({
      orderBy: { stock: 'asc' },
      take: 5,
    });

    res.json({
      period: 'Last 7 days',
      totalRevenue: currentSales,
      revenueChange: salesChange.toFixed(1),
      transactionCount: currentWeekTx.filter((t) => t.type === 'OUT').length,
      bestSellers,
      lowStockWarnings: lowStock.filter((p) => p.stock <= p.lowStockThreshold),
    });
  } catch (error) {
    console.error('Error fetching weekly report:', error);
    res.status(500).json({ error: 'Failed to fetch weekly report' });
  }
});

export default router;
