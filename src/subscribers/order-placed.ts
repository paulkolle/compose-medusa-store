import { Modules } from '@medusajs/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'


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
        await notificationModuleService.createNotifications([{
            to: order.email,
            channel: "email",
            template: "order-confirmation",
            data: {
                subject: "Bestellbestätigung",
                html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bestellbestätigung</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .order-info, .shipping-info, .items, .total {
            margin-bottom: 15px;
        }
        .items ul {
            list-style: none;
            padding: 0;
        }
        .items li {
            padding: 5px 0;
            border-bottom: 1px solid #ddd;
        }
        .total {
            font-size: 18px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Bestellbestätigung</div>
        
        <p>Vielen Dank für Ihre Bestellung <strong>#${order.id}</strong>!</p>
        
        <div class="shipping-info">
            <strong>Versandadresse:</strong><br>
            ${order.shipping_address?.first_name ?? "Unbekannt"} ${order.shipping_address?.last_name ?? ""}<br>
            ${order.shipping_address?.address_1 ?? "Keine Adresse"}, ${order.shipping_address?.postal_code ?? "????"} ${order.shipping_address?.city ?? "Unbekannte Stadt"}, ${order.shipping_address?.country_code?.toUpperCase() ?? "??"}
        </div>
        
        <div class="items">
            <strong>Bestellte Artikel:</strong>
            <ul>
                ${order.items?.map(item => `
                <li>
                    ${item.product_title ?? "Unbekanntes Produkt"} (${item.product_subtitle ?? "Keine Beschreibung"}) - ${item.quantity ?? 1}x ${item.unit_price ?? "??"} ${order.currency_code?.toUpperCase() ?? "???"}
                </li>
                `).join('') || "<li>- Keine Artikel gefunden</li>"}
            </ul>
        </div>
        
        <div class="total">
            Gesamtbetrag: ${order.summary?.current_order_total ?? "??"} ${order.currency_code?.toUpperCase() ?? "???"}
        </div>
        
        
        <p>Wir danken Ihnen für Ihr Vertrauen!</p>
    </div>
</body>
</html>

                
                `,
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