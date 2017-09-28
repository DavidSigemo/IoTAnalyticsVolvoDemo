using System.Web.Mvc;
using System.Threading.Tasks;
using IoTAnalyticsDataVisualization.Services;
using System;
using System.Web;

namespace IoTAnalyticsDataVisualization.Controllers
{
    public class HomeController : Controller
    {
        static DataService dataService = new DataService();

        // GET: Home
        public async Task<ActionResult> Index()
        {
            var subscriptionName = "";
            HttpCookie subscriptionNameCookie = Request.Cookies["subscriptionName"];
            if (subscriptionNameCookie == null || string.IsNullOrEmpty(subscriptionNameCookie.Value))
            {
                subscriptionName = Guid.NewGuid().ToString();
                subscriptionNameCookie = new HttpCookie("subscriptionName", subscriptionName);
            }
            else {
                subscriptionName = subscriptionNameCookie.Value;
            }

            subscriptionNameCookie.Expires = DateTime.Now.AddMinutes(5);
            Response.SetCookie(subscriptionNameCookie);

            var subscriptionExists = await dataService.GetOrCreateSubscription(subscriptionName);
            return View();
        }


        [HttpGet]
        public async Task<string> GetDataSessionType()
        {
            HttpCookie subscriptionNameCookie = Request.Cookies["subscriptionName"];

            var subscriptionName = subscriptionNameCookie.Value;
            var returnVal = await dataService.GetDataAsync(subscriptionName);

            if (!string.IsNullOrEmpty(returnVal))
                return returnVal;

            return string.Empty;
        }
    }
}