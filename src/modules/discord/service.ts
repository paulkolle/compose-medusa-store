import { AbstractNotificationProviderService } from "@medusajs/framework/utils"
import { Logger } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import axios from "axios"

type InjectedDependencies = {
    logger: Logger
}

type Options = {
    webhookUrl: string
}

class DiscordNotificationProviderService extends AbstractNotificationProviderService {
    static identifier = "discord"

    protected logger_: Logger
    protected options_: Options

    constructor(
        { logger }: InjectedDependencies,
        options: Options
    ) {
        super()
        this.logger_ = logger
        this.options_ = options

        if (!this.options_.webhookUrl) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Webhook-URL ist erforderlich."
            )
        }
    }

    static validateOptions(options: Record<any, any>) {
        if (!options.webhookUrl) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Webhook-URL ist erforderlich in den Provider-Optionen."
            )
        }
    }

    async send(notification) {
        try {
            // Nachrichtendaten vorbereiten
            const message = {
                content: notification.data?.text || "Neue Benachrichtigung von Medusa!",
                username: "Medusa Bot",
                embeds: notification.data?.embeds || []
            }

            // Discord Webhook-API aufrufen
            const response = await axios.post(this.options_.webhookUrl, message)

            this.logger_.info(`Discord Nachricht gesendet: ${response.status}`)

            return {
                id: response.data.id || new Date().getTime().toString(), // Falls keine ID zurückkommt, nutze Timestamp
            }
        } catch (err) {
            this.logger_.error(`Fehler beim Senden an Discord: ${err.message}`)
            throw new MedusaError(
                MedusaError.Types.UNEXPECTED_STATE,
                `Fehler beim Senden der Discord Nachricht: ${err.message}`
            )
        }
    }
}

export default DiscordNotificationProviderService
