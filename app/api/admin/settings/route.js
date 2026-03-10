import Setting from "@/models/Setting";
import { requireAdmin } from "@/lib/auth";

export async function GET(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Setting.sync();
    const settings = await Setting.findAll();

    const settingsObj = {};
    for (const s of settings) {
      settingsObj[s.settingKey] = s.value;
    }

    return Response.json({ success: true, settings: settingsObj });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to fetch settings", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { error } = requireAdmin(request);
    if (error) return error;

    await Setting.sync();
    const { deliveryCharge, codEnabled, prePaymentEnabled, prePaymentPercent } = await request.json();

    // Update COD setting if provided
    if (codEnabled !== undefined) {
      const codVal = codEnabled ? "1" : "0";
      const existingCod = await Setting.findOne({ settingKey: "codEnabled" });
      if (existingCod) {
        await Setting.update(existingCod.id, { value: codVal });
      } else {
        await Setting.create({ settingKey: "codEnabled", value: codVal });
      }
    }

    // Update pre-payment settings if provided
    if (prePaymentEnabled !== undefined) {
      const val = prePaymentEnabled ? "1" : "0";
      const existing = await Setting.findOne({ settingKey: "prePaymentEnabled" });
      if (existing) {
        await Setting.update(existing.id, { value: val });
      } else {
        await Setting.create({ settingKey: "prePaymentEnabled", value: val });
      }
    }

    if (prePaymentPercent !== undefined && prePaymentPercent !== null) {
      const pct = Number(prePaymentPercent);
      if (!isNaN(pct) && pct >= 0 && pct <= 100) {
        const existing = await Setting.findOne({ settingKey: "prePaymentPercent" });
        if (existing) {
          await Setting.update(existing.id, { value: String(pct) });
        } else {
          await Setting.create({ settingKey: "prePaymentPercent", value: String(pct) });
        }
      }
    }

    // Update delivery charge if provided
    if (deliveryCharge !== undefined && deliveryCharge !== null) {
      if (isNaN(Number(deliveryCharge)) || Number(deliveryCharge) < 0) {
        return Response.json(
          { success: false, message: "Valid delivery charge amount is required" },
          { status: 400 }
        );
      }

      const existing = await Setting.findOne({ settingKey: "deliveryCharge" });
      if (existing) {
        await Setting.update(existing.id, { value: String(Number(deliveryCharge).toFixed(2)) });
      } else {
        await Setting.create({ settingKey: "deliveryCharge", value: String(Number(deliveryCharge).toFixed(2)) });
      }
    }

    return Response.json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    return Response.json(
      { success: false, message: "Failed to update settings", error: error.message },
      { status: 500 }
    );
  }
}
