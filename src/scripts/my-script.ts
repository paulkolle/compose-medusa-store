import { 
    ExecArgs,
    IProductModuleService,
  } from "@medusajs/framework/types"
  import { Modules } from "@medusajs/framework/utils"
  import OrderModule from "@medusajs/medusa/order"
  import { INotificationModuleService, IOrderModuleService } from '@medusajs/types'

  
  export default async function myScript({ args, container }: ExecArgs) {
    const productModuleService: IProductModuleService = container.resolve(
      Modules.PRODUCT
    )

        const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  
    const order = await orderModuleService.retrieveOrder(args[0], { 
        relations: ['items', 'summary', 'shipping_address'] 
      })
      
      console.log(JSON.stringify(order, null, 2)) // Formatiert das Objekt schön in der Konsole
    //   console.log(`The arguments you passed: ${args}`)
      
  }


