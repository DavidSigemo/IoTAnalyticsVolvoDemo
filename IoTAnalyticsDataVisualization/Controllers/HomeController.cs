using System.Web.Mvc;
using System.Threading.Tasks;
using IoTAnalyticsDataVisualization.Services;
using System;

namespace IoTAnalyticsDataVisualization.Controllers
{
    public class HomeController : Controller
    {
        static DataService dataService = new DataService();

        // GET: Home
        public ActionResult Index()
        {
            var subscriptionName = Guid.NewGuid().ToString();
            Session["subscriptionName"] = subscriptionName;
            dataService.CreateSubscription(subscriptionName);
            return View();
        }


        [HttpGet]
        public async Task<string> GetDataSessionType()
        {
            var subscriptionName = Session["subscriptionName"] as string;
            var returnVal = await dataService.GetDataAsync(subscriptionName);

            if (!string.IsNullOrEmpty(returnVal))
                return returnVal;

            return string.Empty;
        }
        
        [HttpGet]
        public void RemoveSubscription()
        {
            var subscriptionName = Session["subscriptionName"] as string;

            dataService.RemoveSubscription(subscriptionName);
        }
    }
}