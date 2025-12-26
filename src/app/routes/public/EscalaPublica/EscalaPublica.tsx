import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../../../utils/apiClient';
import './EscalaPublica.css';

interface Person {
    id: string;
    full_name: string;
    photo_url: string | null;
}

interface Responsibility {
    id: string;
    name: string;
    image_url: string | null;
}

interface ScheduleMember {
    id: string;
    person: Person;
    status: string;
    present: boolean | null;
    responsibility: Responsibility;
}

interface Schedule {
    id: string;
    start_datetime: string;
    end_datetime: string;
    schedule_type: string;
    status: string;
    groups?: Array<{ id: string, name: string }>;
    team?: { id: string, name: string };
    schedule_members: ScheduleMember[];
}

interface PaginatedResponse {
    data: Schedule[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

const EscalaPublica: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<Schedule[]>([]);
    const [meta, setMeta] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await apiClient<PaginatedResponse>(`/api/scheduled-areas/${id}/schedules/optimized?page=1&limit=50`);
                setData(response.data);
                setMeta(response.meta);
            } catch (err: any) {
                console.error('Erro ao buscar escala:', err);
                setError(err.message || 'Não foi possível carregar a escala.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const groupedSchedules = useMemo(() => {
        const groups: { [key: string]: Schedule[] } = {};

        const sortedData = [...data].sort((a, b) =>
            new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
        );

        sortedData.forEach(schedule => {
            const date = new Date(schedule.start_datetime);
            const dateKey = date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(schedule);
        });

        return groups;
    }, [data]);

    const getWeekday = (dateString: string) => {
        const date = new Date(data.find(s =>
            new Date(s.start_datetime).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }) === dateString
        )?.start_datetime || '');

        return date.toLocaleDateString('pt-BR', { weekday: 'long' });
    };

    if (loading) {
        return (
            <div className="public-escala-loading">
                <div className="loader"></div>
                <p>Carregando escala...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="public-escala-error">
                <div className="error-card">
                    <span className="error-icon">⚠️</span>
                    <h2>Ops! Algo deu errado</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-button">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="public-escala-page">
            <header className="public-escala-header">
                <div className="header-content">
                    <h1>Equipe Mídia</h1>
                </div>
            </header>

            <main className="public-escala-content">
                {data.length === 0 ? (
                    <div className="no-data">
                        <p>Nenhuma escala encontrada para esta área.</p>
                    </div>
                ) : (
                    Object.keys(groupedSchedules).map((dateKey) => (
                        <section key={dateKey} className="date-group">
                            <div className="date-header">
                                <div className="date-info">
                                    <span className="weekday">{"Semana" || getWeekday(dateKey)}</span>
                                    <h2 className="date-title">{dateKey}</h2>
                                </div>
                                <div className="date-divider"></div>
                            </div>

                            <div className="schedules-grid">
                                {groupedSchedules[dateKey].map((schedule) => (
                                    <div key={schedule.id} className="public-schedule-card">
                                        <div className="card-header">
                                            <div className="schedule-info">
                                                {schedule.schedule_type === 'group' ? (
                                                    <span className="info-badge group">
                                                        {schedule.groups?.[0]?.name || schedule.schedule_members[0]?.responsibility.name || 'Escala de Grupo'}
                                                    </span>
                                                ) : (
                                                    <div className="badge-container">
                                                        {Array.from(new Set(schedule.schedule_members.map(m => m.responsibility.name))).map((name, idx) => (
                                                            <span key={idx} className="info-badge team">
                                                                {name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="members-list">
                                            {schedule.schedule_members.map((member) => (
                                                <div key={member.id} className="member-item">
                                                    <div className="member-avatar">
                                                        {member.person.photo_url ? (
                                                            <img src={member.person.photo_url} alt={member.person.full_name} />
                                                        ) : (
                                                            <div className="avatar-placeholder">
                                                                {member.person.full_name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="member-info">
                                                        <span className="member-name">{member.person.full_name}</span>
                                                        {schedule.schedule_type !== 'group' && (
                                                            <span className="member-role">{member.responsibility.name}</span>
                                                        )}
                                                    </div>
                                                    {member.status !== 'pending' && (
                                                        <div className={`member-status-badge ${member.status}`}>
                                                            {member.status === 'accepted' ? '✓' : '✕'}
                                                        </div>
                                                    )}
                                                    {member.status === 'pending' && (
                                                        <div className="member-status-pending">
                                                            <span className="status-dot"></span>
                                                            <span className="status-text">Pendente</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </main>

            <footer className="public-escala-footer">
                <p>&copy; {new Date().getFullYear()} Sistema de Escalas. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default EscalaPublica;
