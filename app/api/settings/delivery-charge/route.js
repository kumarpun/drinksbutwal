import Setting from "@/models/Setting";

export async function GET() {
  try {
    await Setting.sync();
    const setting = await Setting.findOne({ settingKey: "deliveryCharge" });
    const deliveryCharge = setting ? Number(setting.value) : 0;

    const codSetting = await Setting.findOne({ settingKey: "codEnabled" });
    const codEnabled = codSetting ? codSetting.value !== "0" : true;

    const prePaySetting = await Setting.findOne({ settingKey: "prePaymentEnabled" });
    const prePaymentEnabled = prePaySetting ? prePaySetting.value !== "0" : true;

    const prePayPctSetting = await Setting.findOne({ settingKey: "prePaymentPercent" });
    const prePaymentPercent = prePayPctSetting ? Number(prePayPctSetting.value) : 30;

    return Response.json({ success: true, deliveryCharge, codEnabled, prePaymentEnabled, prePaymentPercent });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch delivery charge", error: error.message },
      { status: 500 }
    );
  }
}
