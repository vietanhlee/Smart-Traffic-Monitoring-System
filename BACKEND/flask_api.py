from flask import Flask, jsonify
from tracking_information_veheicle.AnalyzeOnRoadForMultiThreading import AnalyzeOnRoadForMultiThreading

app = Flask(__name__)
analyze_multi = None

@app.route('/results', methods=['GET'])
def get_results():
    global analyze_multi
    if analyze_multi is None:
        analyze_multi = AnalyzeOnRoadForMultiThreading(show=False)
        analyze_multi.process()
    results = analyze_multi.get_results_for_all_threads()
    return jsonify(results)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
