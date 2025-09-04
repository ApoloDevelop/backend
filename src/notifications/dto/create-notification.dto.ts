import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum NotificationType {
  COMMENT_REPLY = 'comment_reply',
  NEW_FOLLOWER = 'new_follower',
  REVIEW_UPVOTE = 'review_upvote',
}

export class CreateNotificationDto {
  @IsInt()
  user_id: number;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @MaxLength(500)
  message: string;

  @IsOptional()
  @IsInt()
  comment_id?: number;

  @IsOptional()
  @IsInt()
  follower_id?: number;

  @IsOptional()
  @IsInt()
  review_id?: number;
}
