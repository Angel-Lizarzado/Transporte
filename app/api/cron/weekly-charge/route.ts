import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import dayjs from "dayjs";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // ------------------------
    // 1. Auth con CRON_SECRET
    // ------------------------
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No auth header" }, { status: 401 });
    }

    if (auth.split(" ")[1] !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // ------------------------
    // 2. Supabase cliente
    // ------------------------
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log("Supabase client creado");

    // ------------------------
    // 3. Obtener organizaciones
    // ------------------------
    const { data: orgs, error: orgErr } = await supabase
      .from("organizations")
      .select("id, created_by");

    if (orgErr) throw orgErr;

    for (const org of orgs) {
      const orgId = org.id;

      // ------------------------
      // 4. Obtener app_config
      // ------------------------
      const { data: config } = await supabase
        .from("app_config")
        .select("*")
        .eq("organization_id", orgId)
        .single();

      const lastApplied = config?.last_weekly_charge_applied;

      // ------------------------
      // 5. Verificar si ya se aplicó esta semana
      // ------------------------
      const alreadyApplied =
        lastApplied &&
        dayjs(lastApplied).isAfter(dayjs().startOf("week"));

      // logs base
      const jsonLog: any = {
        org_id: orgId,
        executed_at: new Date().toISOString(),
        status: alreadyApplied ? "skipped" : "success",
        total: 0,
        passengers: [],
      };

      let textLog = `
=== WEEKLY CHARGE REPORT ===
📅 Fecha: ${dayjs().format("YYYY-MM-DD HH:mm")}
🏢 Organización: ${orgId}
`;

      if (alreadyApplied) {
        textLog += `
⛔ YA APLICADO ESTA SEMANA  
Se saltó esta organización porque ya tenía cargos registrados esta semana.

-------------------------------------------
Estado final: ⏭ Saltado
-------------------------------------------
`;

        await supabase.from("cron_logs").insert({
          org_id: orgId,
          result: textLog.trim(),
          result_json: jsonLog,
          status: "skipped",
        });

        console.log(`⚠ Ya aplicado esta semana en ${orgId}, salto.`);
        continue;
      }

      // ------------------------
      // 6. Obtener pasajeros activos
      // ------------------------
      const { data: passengers, error: pErr } = await supabase
        .from("passengers")
        .select("*")
        .eq("organization_id", orgId)
        .eq("activo", true);

      if (pErr) throw pErr;

      textLog += `\n🧒 Pasajeros procesados:\n`;

      const appliedTransactions = [];
      let total = 0;

      try {
        // ------------------------
        // 7. Procesar cada pasajero
        // ------------------------
        for (const p of passengers) {
          const rate =
            p.tarifa_personalizada ??
            p.tarifa_semanal_usd ??
            config.tarifa_general_usd ??
            0;

          if (rate <= 0) continue;

          total += Number(rate);

          // Crear transacción
          await supabase.from("transactions").insert({
            id: crypto.randomUUID(),
            organization_id: orgId,
            representante_id: p.representante_id,
            fecha: new Date().toISOString(),
            tipo: "cargo",
            monto_usd: rate,
            concepto: `Cargo semanal para ${p.nombre}`,
            created_by: org.created_by,
          });

          appliedTransactions.push({
            passenger_id: p.id,
            name: p.nombre,
            rate,
          });

          textLog += ` - ${p.nombre} → $${rate}\n`;
        }

        // ------------------------
        // 8. Actualizar last_weekly_charge_applied
        // ------------------------
        await supabase
          .from("app_config")
          .update({
            last_weekly_charge_applied: new Date().toISOString(),
          })
          .eq("organization_id", orgId);

        textLog += `
💰 Total cobrado esta semana: $${total}

-------------------------------------------
Estado final: ✅ Success
-------------------------------------------
`;

        jsonLog.passengers = appliedTransactions;
        jsonLog.total = total;

        // Guardar log
        await supabase.from("cron_logs").insert({
          org_id: orgId,
          result: textLog.trim(),
          result_json: jsonLog,
          status: "success",
        });
      } catch (e: any) {
        // ------------------------
        // 9. ROLLBACK COMPLETO DE HOY
        // ------------------------
        await supabase
          .from("transactions")
          .delete()
          .eq("organization_id", orgId)
          .eq("tipo", "cargo")
          .gte("fecha", dayjs().startOf("day").toISOString());

        textLog += `
❌ ERROR DURANTE EL PROCESO
Motivo: ${e.message}

🔄 Rollback realizado (transacciones de hoy removidas)
`;

        jsonLog.status = "error";
        jsonLog.error = e.message;

        await supabase.from("cron_logs").insert({
          org_id: orgId,
          result: textLog.trim(),
          result_json: jsonLog,
          status: "error",
          error_detail: e.message,
        });

        continue;
      }
    }

    console.log("=== CRON COMPLETED ===");
    return NextResponse.json(
      { ok: true, time_ms: Date.now() - startTime },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("CRON ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
