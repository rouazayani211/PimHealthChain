export class CreateMessageDto {
    readonly senderId: string;
    readonly recipientId: string;
    readonly content: string;
  }