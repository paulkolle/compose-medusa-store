import { Modules } from '@medusajs/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'

const dc_user_id = process.env.DC_USER_ID
const telegram_username = process.env.TELEGRAM_USERNAME

export default async function orderPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<any>) {
    const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)

    const order = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] })
    // const shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id)

    console.log("ORDER PLATZIERT")
    if (!order.email) {
        throw new Error("Order email is missing");
    }
    try {
        const html = `
        <h1>Bestellbestätigung</h1>
        <p>Vielen Dank für Ihre Bestellung <strong>#${order.display_id ?? "?"}</strong> vom <strong>${order.created_at ? new Date(order.created_at).toLocaleDateString("de-DE") : "?"}</strong>.</p>
      
        <h2>Bestelldetails</h2>
        ${Array.isArray(order.items) && order.items.length > 0
                ? `
          <table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Variante</th>
                <th>Menge</th>
                <th>Einzelpreis</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product_title ?? "-"}</td>
                  <td>${item.variant_title ?? "-"}</td>
                  <td>${item.quantity ?? "0"}</td>
                  <td>${typeof item.unit_price === "number" ? (item.unit_price).toFixed(2) : "-"} €</td>
                </tr>
              `).join('')}
            </tbody>
          </table>`
                : "<p><em>Keine Artikel gefunden.</em></p>"
            }
      
        <p><strong>Gesamtbetrag (inkl. Versand): ${typeof order.summary?.current_order_total === "number"
                ? (order.summary.current_order_total).toFixed(2)
                : "-"
            } €</strong></p>
      
        <h2>Lieferadresse</h2>
        ${order.shipping_address
                ? `
          <p>
            ${order.shipping_address.first_name ?? ""} ${order.shipping_address.last_name ?? ""}<br />
            ${order.shipping_address.address_1 ?? ""}<br />
            ${order.shipping_address.postal_code ?? ""} ${order.shipping_address.city ?? ""}<br />
            ${order.shipping_address.country_code?.toUpperCase() ?? ""}<br />
            ${order.shipping_address.phone ? 'Tel: ' + order.shipping_address.phone : ''}
          </p>`
                : "<p><em>Keine Lieferadresse vorhanden.</em></p>"
            }
      
 <p>Bei Fragen zur Bestellung stehen wir Ihnen gerne zur Verfügung.</p>
<p>
  Schreiben Sie uns direkt auf 
  <a href="https://discord.com/users/${dc_user_id}" target="_blank">Discord</a>, 
  <a href="https://t.me/${telegram_username}" target="_blank">Telegram</a> 
  oder antworten Sie einfach auf diese E-Mail.
</p>

<p>Mit freundlichen Grüßen,<br />Paul Kohlschein</p>

      `


        // console.log(JSON.stringify(order, null, 2))

        await notificationModuleService.createNotifications([{
            to: order.email,
            channel: "email",
            template: "order-confirmation",
            data: {
                subject: "Bestellbestätigung",
                html
            },
        },
        {
            to: "discord", // Discord erfordert keine spezifische Empfängeradresse
            channel: "discord",
            template: "order-confirmation",
            data: {
                text:
                    `📢 **Neue Bestellung erhalten!** 🛒
    **Bestellung #${order.id}**

    👤 **Kunde:** ${order.shipping_address?.first_name ?? "Unbekannt"} ${order.shipping_address?.last_name ?? ""} (${order.email ?? "Keine E-Mail"})
    📍 **Adresse:** ${order.shipping_address?.address_1 ?? "Keine Adresse"}, ${order.shipping_address?.postal_code ?? "????"} ${order.shipping_address?.city ?? "Unbekannte Stadt"}, ${order.shipping_address?.country_code?.toUpperCase() ?? "??"}

    📦 **Bestellte Artikel:**
        \`\`\`
        ${order.items?.map(item => `- ${item.product_title ?? "Unbekanntes Produkt"} (${item.product_subtitle ?? "Keine Beschreibung"}) - ${item.quantity ?? 1}x ${item.unit_price ?? "??"} ${order.currency_code?.toUpperCase() ?? "???"}`).join("\n") || " - Keine Artikel gefunden"}
        \`\`\`

    💰 **Gesamtbetrag:** ${order.summary?.current_order_total ?? "??"} ${order.currency_code?.toUpperCase() ?? "???"}
    💳 **Zahlstatus:** ${order.summary?.paid_total > 0 ? "Bezahlt" : "Offen"}
    🛒 **Bestellstatus:** ${order.status ?? "Unbekannt"}`
            }
        }]
        )
    } catch (error) {
        console.error('Error sending order confirmation notification:', error)
    }
}

export const config: SubscriberConfig = {
    event: 'order.placed'
}