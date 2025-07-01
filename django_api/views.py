from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from AnalyzeOnRoadForMultiThreading import AnalyzeOnRoadForMultiThreading

analyze_multi = None

@csrf_exempt
def results(request):
    global analyze_multi
    if analyze_multi is None:
        analyze_multi = AnalyzeOnRoadForMultiThreading(show=False)
        analyze_multi.process()
    results = analyze_multi.get_results_for_all_threads()
    return JsonResponse(results)
    return JsonResponse(results)
