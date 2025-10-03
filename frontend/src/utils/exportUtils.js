// src/utils/exportUtils.js
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get all unique keys from the data
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] ?? '';
        // Escape commas and quotes in values
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Create URL and trigger download
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportRankingsToCSV = (rankings, competitionName) => {
  const exportData = rankings.map(ranking => ({
    'Rank': ranking.rank,
    'Name': ranking.participant_name,
    'Zone': ranking.zone,
    'Event': ranking.event,
    'School': ranking.school_name,
    'Age': ranking.age,
    'Gender': ranking.gender,
    'Lane': ranking.lane_number,
    'Total Score': ranking.total_score,
    'Series Completed': ranking.series_completed,
    'Best Series': ranking.best_series,
    'Average Score': ranking.avg_score ? ranking.avg_score.toFixed(1) : '0.0'
  }));

  exportToCSV(exportData, `${competitionName}_Rankings`);
};

export const exportParticipantsToCSV = (participants, competitionName) => {
  const exportData = participants.map(participant => ({
    'ID': participant.id,
    'Name': participant.name,
    'Phone': participant.phone,
    'Zone': participant.zone,
    'Event': participant.event,
    'School': participant.school_name,
    'Age': participant.age,
    'Gender': participant.gender,
    'Lane Number': participant.lane_number,
    'Registration Date': new Date(participant.created_at).toLocaleDateString()
  }));

  exportToCSV(exportData, `${competitionName}_Participants`);
};

export const exportScoresToCSV = (scores, competitionName) => {
  const exportData = scores.map(score => ({
    'Participant': score.participant_name,
    'Event': score.event,
    'Series': score.series_number,
    'Shot 1': score.shot_1 || '',
    'Shot 2': score.shot_2 || '',
    'Shot 3': score.shot_3 || '',
    'Shot 4': score.shot_4 || '',
    'Shot 5': score.shot_5 || '',
    'Shot 6': score.shot_6 || '',
    'Shot 7': score.shot_7 || '',
    'Shot 8': score.shot_8 || '',
    'Shot 9': score.shot_9 || '',
    'Shot 10': score.shot_10 || '',
    'Series Total': score.total_score,
    'Date': new Date(score.created_at).toLocaleDateString()
  }));

  exportToCSV(exportData, `${competitionName}_Detailed_Scores`);
};

export const exportCompetitionSummary = (competition, stats) => {
  const exportData = [{
    'Competition Name': competition.name,
    'Year': competition.year,
    'Status': competition.status,
    'Description': competition.description,
    'Total Participants': stats.total_participants,
    'Total Series': stats.total_series,
    'Active Participants': stats.active_participants,
    'Completed Series': stats.completed_series,
    'Average Score': stats.average_score ? stats.average_score.toFixed(1) : '0.0',
    'Highest Score': stats.highest_score || 0,
    'Created Date': new Date(competition.created_at).toLocaleDateString(),
    'Export Date': new Date().toLocaleDateString()
  }];

  exportToCSV(exportData, `${competition.name}_Summary`);
};