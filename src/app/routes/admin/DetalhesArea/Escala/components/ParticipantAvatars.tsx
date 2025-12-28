import { type ScheduleOptimizedResponseDto } from '../../../../../../services/basic/scheduleService'
import { addCacheBusting } from '../../../../../../utils/fileUtils'

interface ParticipantAvatarsProps {
    participants: NonNullable<ScheduleOptimizedResponseDto['people'] | ScheduleOptimizedResponseDto['participants']>
}

export function ParticipantAvatars({ participants }: ParticipantAvatarsProps) {
    return (
        <div className="table-participants-avatars">
            {participants.map((person, index) => {
                const isRejected = person.status === 'rejected'

                return (
                    <div
                        key={index}
                        className="table-participant-avatar-wrapper"
                        style={{ zIndex: participants.length - index }}
                    >
                        <div
                            className="table-participant-avatar"
                            title={`${person.name}${person.role ? ` - ${person.role}` : ''}`}
                        >
                            <div className="table-participant-avatar-content">
                                {person.url ? (
                                    <img
                                        src={addCacheBusting(person.url)}
                                        alt={person.name}
                                        className="table-participant-avatar-image"
                                        loading="lazy"
                                        decoding="async"
                                    />
                                ) : (
                                    <div className="table-participant-avatar-placeholder">
                                        {person.name && person.name.length > 0
                                            ? person.name.charAt(0).toUpperCase()
                                            : '?'}
                                    </div>
                                )}
                            </div>
                            {isRejected && (
                                <div className="table-participant-alert" title="Participante rejeitado">
                                    <i className="fa-solid fa-exclamation-triangle"></i>
                                </div>
                            )}
                            <div className="table-participant-tooltip">
                                <div className="tooltip-name">{person.name}</div>
                                {person.role && (
                                    <div className="tooltip-role">{person.role}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
