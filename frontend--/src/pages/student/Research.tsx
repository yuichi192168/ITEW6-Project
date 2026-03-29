import React from 'react';
import { mockResearch } from '../../lib/constants';
import { FileText } from 'lucide-react';

export const StudentResearch: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Research</h1>

      <div className="space-y-4">
        {mockResearch.map((research) => (
          <div key={research.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start gap-3">
                  <FileText className="text-primary mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">{research.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">Author: {research.author}</p>
                    <p className="text-gray-600 text-sm">Year: {research.year}</p>
                  </div>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${research.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {research.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
