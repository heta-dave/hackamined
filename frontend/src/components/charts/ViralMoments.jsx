import React from 'react';

const ViralMoments = ({ moments }) => {
    if (!moments || moments.length === 0) {
        return (
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 h-full text-center text-gray-500">
                <h3 className="text-gray-500 font-semibold text-sm mb-2 uppercase tracking-wider">Viral Moments</h3>
                <p className="mt-4">No significant viral signals detected.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <h3 className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">
                Narrative Viral Signals
            </h3>

            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-[#f0f0f0]">

                {moments.map((moment, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Timeline dot */}
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border border-[#f0f0f0] bg-white text-gray-400 group-hover:text-black group-hover:border-black/10 shadow-sm transition-all absolute left-0 md:left-1/2 -translate-x-1/2 z-10">
                            <span className="font-mono text-[10px] font-bold">{idx + 1}</span>
                        </div>

                        {/* Content Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] p-5 rounded-2xl bg-[#fafafa] border border-[#f0f0f0] group-hover:bg-white group-hover:shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] transition-all ml-14 md:ml-0">
                            <div className="flex justify-between items-start mb-3">
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-gray-500 bg-white rounded border border-[#f0f0f0]">
                                    {moment.reason}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400" title="Viral Score">
                                    SCORE: {moment.score.toFixed(2)}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed italic border-l border-black/5 pl-4 py-1">
                                "{moment.text}"
                            </p>
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
};

export default ViralMoments;
