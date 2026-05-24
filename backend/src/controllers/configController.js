const { TaxInsuranceConfig } = require('../models');

// GET /api/config/tax-insurance
exports.getConfig = async (req, res) => {
  try {
    let config = await TaxInsuranceConfig.findByPk(1);
    if (!config) {
      // Create default if not exists
      config = await TaxInsuranceConfig.create({ id: 1 });
    }
    res.json(config);
  } catch (error) {
    console.error('Lỗi khi lấy cấu hình thuế và bảo hiểm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// PUT /api/config/tax-insurance
exports.updateConfig = async (req, res) => {
  try {
    const {
      social_insurance_rate,
      health_insurance_rate,
      unemployment_insurance_rate,
      base_salary,
      max_insurance_salary,
      personal_deduction,
      dependent_deduction
    } = req.body;

    let config = await TaxInsuranceConfig.findByPk(1);
    if (!config) {
      config = await TaxInsuranceConfig.create({ id: 1 });
    }

    config.social_insurance_rate = social_insurance_rate ?? config.social_insurance_rate;
    config.health_insurance_rate = health_insurance_rate ?? config.health_insurance_rate;
    config.unemployment_insurance_rate = unemployment_insurance_rate ?? config.unemployment_insurance_rate;
    config.base_salary = base_salary ?? config.base_salary;
    config.max_insurance_salary = max_insurance_salary ?? config.max_insurance_salary;
    config.personal_deduction = personal_deduction ?? config.personal_deduction;
    config.dependent_deduction = dependent_deduction ?? config.dependent_deduction;

    await config.save();

    res.json({ message: 'Cập nhật cấu hình thành công', config });
  } catch (error) {
    console.error('Lỗi khi cập nhật cấu hình thuế và bảo hiểm:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};
