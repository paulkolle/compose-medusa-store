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
        await notificationModuleService.createNotifications({
            to: order.email,
            channel: "email",
            template: "order-confirmation",
            data: {
                subject: "Bestellbestätigung",
                html: `<p>Vielen Dank für Ihre Bestellung #${order.id}!</p>`,
            },
        })
    } catch (error) {
        console.error('Error sending order confirmation notification:', error)
    }
}

export const config: SubscriberConfig = {
    event: 'order.placed'
}