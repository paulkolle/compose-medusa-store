import {
    AbstractNotificationProviderService,
    MedusaError
} from "@medusajs/framework/utils"

import { Logger } from "@medusajs/framework/types"
import nodemailer from "nodemailer"

import {
    ProviderSendNotificationDTO,
    ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"

type InjectedDependencies = {
    logger: Logger
}

type Options = {
    host: string
    port: number
    auth: {
        user: string
        pass: string
    }
}

class NodemailerProviderService extends AbstractNotificationProviderService {
    protected logger_: Logger
    protected options_: Options
    private transporter: nodemailer.Transporter

    // Statische identifier-Eigenschaft hinzufügen
    static identifier = "nodemailer"

    static validateOptions(options: Record<any, any>): void | never {
        if (!options.host) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Host muss in den Provider-Optionen angegeben sein."
            )
        }
    
        if (!options.port) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Port muss in den Provider-Optionen angegeben sein."
            )
        }
    
        if (!options.auth || !options.auth.user || !options.auth.pass) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Auth muss Benutzername (user) und Passwort (pass) in den Provider-Optionen enthalten."
            )
        }
    
        if (!options.channels || !Array.isArray(options.channels) || options.channels.length === 0) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Mindestens ein Kanal muss in den Provider-Optionen angegeben sein."
            )
        }
    }


    constructor(
        { logger }: InjectedDependencies,
        options: Options
    ) {
        super()
        this.logger_ = logger
        this.options_ = options

        // SMTP Transporter erstellen
        this.transporter = nodemailer.createTransport({
            host: options.host,
            port: options.port,
            secure: options.port === 465, // true für SSL, false für STARTTLS
            auth: options.auth,
        })
    }

    async send(
        notification: ProviderSendNotificationDTO
    ): Promise<ProviderSendNotificationResultsDTO> {
        try {
            // Mail-Optionen
            const mailOptions = {
                from: `"Dein Shop" <${this.options_.auth.user}>`,
                to: notification.to,
                subject: notification.data?.subject as string || "Benachrichtigung",
                text: notification.data?.text as string || undefined,
                html: notification.data?.html as string || undefined,
            }

            // Senden der E-Mail
            const info = await this.transporter.sendMail(mailOptions)
            this.logger_.info(`Email sent: ${info.messageId}`)

            // Rückgabe: Nur die ID
            return {
                id: info.messageId, // ID der Nachricht im externen System (z. B. SMTP)
            }
        } catch (err) {
            this.logger_.error(`Error sending email: ${err.message}`)
            throw err
        }
    }
}

export default NodemailerProviderService
